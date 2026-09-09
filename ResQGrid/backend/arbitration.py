CARGO_PRIORITY = {
    "Medical Supplies": 40,
    "Food": 30,
    "Construction": 20,
    "Agri": 20,
}

URGENCY_BONUS = {
    "HIGH": 10,
    "NORMAL": 0,
}


def calculate_priority_score(cargo_type, priority, wait_pressure):
    cargo_score = CARGO_PRIORITY.get(cargo_type, 0)
    urgency_score = URGENCY_BONUS.get(priority, 0)

    return cargo_score + urgency_score + wait_pressure

def calculate_wait_pressure(departure_window_end, current_time):
    if not departure_window_end:
        return 0

    remaining_seconds = (
        departure_window_end - current_time
    ).total_seconds()

    if remaining_seconds <= 0:
        return 20
    elif remaining_seconds <= 2 * 3600:
        return 15
    elif remaining_seconds <= 6 * 3600:
        return 10
    elif remaining_seconds <= 12 * 3600:
        return 5
    else:
        return 0

def resolve_conflict(shipments):
    if not shipments:
        return None

    ranked = sorted(
        shipments,
        key=lambda shipment: shipment["priority_score"],
        reverse=True
    )

    winner = ranked[0]

    losers = [
        {
            "shipment_id": shipment["shipment_id"],
            "reason": (
                f"Shipment {winner['shipment_id']} prioritized "
                f"over shipment {shipment['shipment_id']}"
            ),
        }
        for shipment in ranked[1:]
    ]

    return {
        "winner": winner["shipment_id"],
        "losers": losers,
        "decision": "PRIORITY_BASED_ARBITRATION",
    }

