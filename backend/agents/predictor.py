from typing import Dict, List, Optional, Any, Tuple
import networkx as nx
import numpy as np
from pydantic import BaseModel, Field


class HostPrediction(BaseModel):
    host: str
    compromise_probability: float
    est_minutes_to_compromise: float
    blast_radius: int
    tactic: str
    technique_id: str
    explanation: str


class PredictorAgent:
    """
    PredictorAgent constructs an Attack Graph for the 6 environment hosts and runs
    numpy Monte Carlo simulations (1000 runs, seed 42) to forecast upcoming
    host compromises, estimated minutes to compromise, and downstream blast radius.
    """

    def __init__(self, seed: int = 42, n_runs: int = 1000):
        self.seed = seed
        self.n_runs = n_runs
        self.graph = self._build_attack_graph()

    def _build_attack_graph(self) -> nx.DiGraph:
        """Constructs Directed Attack Graph for the 6 environment hosts."""
        G = nx.DiGraph()

        hosts = [
            "laptop-1",
            "laptop-2",
            "workstation-1",
            "app-server",
            "db-server",
            "domain-controller",
        ]
        for host in hosts:
            G.add_node(host)

        # Directed attack edges: (src, dst, prob, delay_min, technique_id, tactic)
        edges = [
            ("laptop-1", "workstation-1", 0.75, 15.0, "T1021", "Lateral Movement"),
            ("laptop-1", "app-server", 0.50, 25.0, "T1021", "Lateral Movement"),
            ("laptop-2", "workstation-1", 0.70, 20.0, "T1021", "Lateral Movement"),
            ("laptop-2", "app-server", 0.45, 30.0, "T1021", "Lateral Movement"),
            (
                "workstation-1",
                "domain-controller",
                0.85,
                20.0,
                "T1068",
                "Privilege Escalation",
            ),
            ("workstation-1", "db-server", 0.65, 35.0, "T1041", "Exfiltration"),
            ("app-server", "db-server", 0.85, 15.0, "T1041", "Exfiltration"),
            ("domain-controller", "db-server", 0.90, 10.0, "T1041", "Exfiltration"),
            (
                "domain-controller",
                "app-server",
                0.75,
                15.0,
                "T1021",
                "Lateral Movement",
            ),
        ]

        for src, dst, prob, delay, tech_id, tactic in edges:
            G.add_edge(
                src,
                dst,
                prob=prob,
                delay=delay,
                technique_id=tech_id,
                tactic=tactic,
            )

        return G

    def _run_monte_carlo(
        self,
        G: nx.DiGraph,
        compromised_hosts: List[str],
        n_runs: int,
        seed: int,
    ) -> Tuple[Dict[str, float], Dict[str, float]]:
        """
        Runs Monte Carlo simulation over graph G starting from compromised_hosts.
        Returns (prob_dict, time_dict).
        """
        rng = np.random.default_rng(seed)
        all_hosts = set(G.nodes())
        compromise_counts: Dict[str, int] = {h: 0 for h in all_hosts}
        compromise_times: Dict[str, List[float]] = {h: [] for h in all_hosts}

        init_comp = set(compromised_hosts).intersection(all_hosts)

        for _ in range(n_runs):
            run_comp: Dict[str, float] = {h: 0.0 for h in init_comp}
            queue = list(init_comp)

            while queue:
                current = queue.pop(0)
                curr_time = run_comp[current]

                for neighbor in G.successors(current):
                    edge_data = G[current][neighbor]
                    prob = edge_data["prob"]
                    delay_mean = edge_data["delay"]

                    # Roll uniform random sample
                    if rng.random() <= prob:
                        delay_sampled = max(1.0, float(rng.normal(delay_mean, 2.0)))
                        reach_time = curr_time + delay_sampled

                        if (
                            neighbor not in run_comp
                            or reach_time < run_comp[neighbor]
                        ):
                            run_comp[neighbor] = reach_time
                            if neighbor not in queue:
                                queue.append(neighbor)

            for host, time_val in run_comp.items():
                if host not in init_comp:
                    compromise_counts[host] += 1
                    compromise_times[host].append(time_val)

        probs: Dict[str, float] = {}
        avg_times: Dict[str, float] = {}

        for host in all_hosts:
            if host in init_comp:
                probs[host] = 1.0
                avg_times[host] = 0.0
            else:
                p = compromise_counts[host] / n_runs
                probs[host] = round(float(p), 4)
                times = compromise_times[host]
                avg_times[host] = (
                    round(float(np.mean(times)), 2) if times else 0.0
                )

        return probs, avg_times

    def predict(
        self,
        compromised_hosts: List[str],
        seed: Optional[int] = None,
        n_runs: Optional[int] = None,
    ) -> List[HostPrediction]:
        """
        Predicts compromise probabilities, estimated time to compromise, and
        blast radius for all uncompromised hosts in the network.
        """
        effective_seed = seed if seed is not None else self.seed
        effective_runs = n_runs if n_runs is not None else self.n_runs

        probs, avg_times = self._run_monte_carlo(
            self.graph, compromised_hosts, effective_runs, effective_seed
        )

        predictions: List[HostPrediction] = []
        uncompromised = [
            h for h in self.graph.nodes() if h not in compromised_hosts
        ]

        for host in uncompromised:
            blast_radius = len(nx.descendants(self.graph, host))

            in_edges = list(self.graph.in_edges(host, data=True))
            tactic = (
                in_edges[0][2].get("tactic", "Lateral Movement")
                if in_edges
                else "Lateral Movement"
            )
            tech_id = (
                in_edges[0][2].get("technique_id", "T1021")
                if in_edges
                else "T1021"
            )

            pred = HostPrediction(
                host=host,
                compromise_probability=probs[host],
                est_minutes_to_compromise=avg_times[host],
                blast_radius=blast_radius,
                tactic=tactic,
                technique_id=tech_id,
                explanation=(
                    f"Host '{host}' has {probs[host]*100:.1f}% risk of compromise "
                    f"within ~{avg_times[host]:.1f} min via {tactic} ({tech_id}). "
                    f"Downstream blast radius: {blast_radius} hosts."
                ),
            )
            predictions.append(pred)

        predictions.sort(key=lambda x: x.compromise_probability, reverse=True)
        return predictions

    def predict_after(
        self,
        response: Dict[str, Any],
        compromised_hosts: List[str],
        seed: Optional[int] = None,
        n_runs: Optional[int] = None,
    ) -> List[HostPrediction]:
        """
        Simulates response mitigation (e.g. isolating host or blocking edge)
        and recalculates updated risk predictions.
        """
        effective_seed = seed if seed is not None else self.seed
        effective_runs = n_runs if n_runs is not None else self.n_runs

        G_mod = self.graph.copy()

        action = str(response.get("action", "")).lower()
        target = response.get("target")
        src = response.get("src")
        dst = response.get("dst")

        if action in ["isolate_host", "isolate", "quarantine"]:
            if target and target in G_mod:
                G_mod.remove_node(target)
        elif action in ["block_edge", "block_port", "block_smb"]:
            if src and dst and G_mod.has_edge(src, dst):
                G_mod.remove_edge(src, dst)
            elif target:
                edges_to_remove = [
                    (u, v) for u, v in G_mod.edges() if u == target or v == target
                ]
                G_mod.remove_edges_from(edges_to_remove)

        probs, avg_times = self._run_monte_carlo(
            G_mod, compromised_hosts, effective_runs, effective_seed
        )

        predictions: List[HostPrediction] = []
        uncompromised = [
            h for h in self.graph.nodes() if h not in compromised_hosts
        ]

        for host in uncompromised:
            if host not in G_mod:
                prob = 0.0
                est_time = 0.0
                blast_radius = 0
            else:
                prob = probs[host]
                est_time = avg_times[host]
                blast_radius = len(nx.descendants(G_mod, host))

            in_edges = list(self.graph.in_edges(host, data=True))
            tactic = (
                in_edges[0][2].get("tactic", "Lateral Movement")
                if in_edges
                else "Lateral Movement"
            )
            tech_id = (
                in_edges[0][2].get("technique_id", "T1021")
                if in_edges
                else "T1021"
            )

            pred = HostPrediction(
                host=host,
                compromise_probability=prob,
                est_minutes_to_compromise=est_time,
                blast_radius=blast_radius,
                tactic=tactic,
                technique_id=tech_id,
                explanation=(
                    f"Post-mitigation risk for '{host}': {prob*100:.1f}% compromise probability. "
                    f"Downstream blast radius: {blast_radius} hosts."
                ),
            )
            predictions.append(pred)

        predictions.sort(key=lambda x: x.compromise_probability, reverse=True)
        return predictions
