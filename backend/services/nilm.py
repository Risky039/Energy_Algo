import random
from typing import List, Dict
from datetime import datetime
from backend.models import Appliance, NILMResponse

class SyntheticSignalGenerator:
    """
    Simulates a home energy environment.
    It generates a total consumption value by summing up enabled appliances.
    For the 'Virtual Disaggregator', we will perform a probabilistic guess based on the total.
    """

    def __init__(self):
        # Define appliance signatures (Mean Watts, Probability of being ON)
        self.appliance_signatures = {
            "Refrigerator": {"mean": 150, "std": 10, "prob": 1.0}, # Always cycles, effectively constant for simplified model or high prob
            "AC": {"mean": 2000, "std": 200, "prob": 0.3},
            "Washing Machine": {"mean": 500, "std": 50, "prob": 0.1},
            "Lights": {"mean": 100, "std": 20, "prob": 0.6},
            "TV": {"mean": 120, "std": 10, "prob": 0.5},
            "EV Charger": {"mean": 7000, "std": 100, "prob": 0.05}
        }

        # Keep track of current state to simulate continuity?
        # For this demo, we can be stateless or simple stateful.
        # Let's be stateless for the "guess" part, but stateful for "generation".

    def generate_current_state(self) -> Dict[str, int]:
        """
        Generates a ground truth state.
        Returns a dict of appliance name -> current watts.
        """
        state = {}
        for name, sig in self.appliance_signatures.items():
            # Basic probability check
            if random.random() < sig["prob"]:
                watts = int(random.gauss(sig["mean"], sig["std"]))
                state[name] = max(0, watts)
            else:
                state[name] = 0
        return state

    def disaggregate(self, total_watts: int) -> List[Appliance]:
        """
        The 'Virtual Disaggregator'.
        Takes total consumption and guesses which appliances are running.
        Since this is a demo without real training data, we use a greedy/probabilistic heuristic.
        """

        # Sort appliances by mean power descending to try to fit big loads first
        sorted_apps = sorted(
            self.appliance_signatures.items(),
            key=lambda x: x[1]["mean"],
            reverse=True
        )

        guessed_appliances = []
        remaining_watts = total_watts

        # 1. Base load check (Refrigerator is almost always on if we have enough power)
        # But let's just use the greedy approach.

        for name, sig in sorted_apps:
            # If remaining watts is close to or greater than the appliance's mean
            # We determine probability based on how much it 'consumes' of the remainder

            # Simple Heuristic: If we have enough watts covering the mean, and it's a high power device,
            # or if it's a low power device and we have leftovers.

            mean_w = sig["mean"]

            # If remaining watts is significantly high, check if this device fits
            if remaining_watts >= (mean_w * 0.8):
                # Guess it's ON
                # But we shouldn't just turn everything ON.
                # Let's add some randomness or check if the remainder would be too small.

                # Special logic for very high load (EV Charger, AC)
                if mean_w > 1000:
                    # If we have 2500W, and AC is 2000W.
                    # If we attribute AC, we have 500W left.
                    # This seems plausible.
                    is_on = True
                else:
                    # For smaller loads, it's harder to distinguish.
                    # Use the defined probability as a tie breaker
                    is_on = random.random() < 0.8 # Bias towards fitting it if space exists

                if is_on:
                    # Assign a value close to mean, but limit by remaining
                    guessed_power = min(remaining_watts, int(random.gauss(mean_w, sig["std"])))
                    guessed_power = max(0, guessed_power)

                    if guessed_power > 0:
                        remaining_watts -= guessed_power
                        guessed_appliances.append(
                            Appliance(name=name, is_running=True, power_draw=guessed_power)
                        )
                    else:
                         guessed_appliances.append(
                            Appliance(name=name, is_running=False, power_draw=0)
                        )
                else:
                    guessed_appliances.append(
                        Appliance(name=name, is_running=False, power_draw=0)
                    )
            else:
                 guessed_appliances.append(
                    Appliance(name=name, is_running=False, power_draw=0)
                )

        # If there is still a lot of remainder, dump it into "Other" or distribute to running lights/etc.
        # For this specific NILM requirement, we just return the list.

        return guessed_appliances

nilm_service = SyntheticSignalGenerator()
