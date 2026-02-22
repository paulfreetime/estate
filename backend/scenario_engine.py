from __future__ import annotations
import numpy as np
from typing import Dict, Any, Iterable, Tuple


def _as_float(x) -> float:
    try:
        return float(x or 0)
    except Exception:
        return 0.0


def scenario_matrix_for_building(
    building: Dict[str, Any],
    rente_values: Iterable[float],
    belaaning_values: Iterable[float],
) -> Dict[str, Any]:
    """
    Returnerer matrix (rente x belåning) med cash_flow og cash_on_cash.
    building forventer: anskaffelse, lejeindtægter, omkostninger_i_alt
    """

    anskaffelse = _as_float(building.get("anskaffelse"))
    leje = _as_float(building.get("lejeindtægter"))
    omk = _as_float(building.get("omkostninger_i_alt"))

    overskud_foer_renter = leje - omk

    r = np.array(list(rente_values), dtype=float) / 100.0          # shape (R,)
    b = np.array(list(belaaning_values), dtype=float) / 100.0      # shape (B,)

    # Broadcast til (R, B)
    rr = r[:, None]
    bb = b[None, :]

    laan = anskaffelse * bb
    udbetaling = anskaffelse - laan
    aarlig_rente = laan * rr

    cash_flow = overskud_foer_renter - aarlig_rente

    # undgå division med 0
    cash_on_cash = np.where(
        udbetaling > 0, (cash_flow / udbetaling) * 100.0, np.nan)

    return {
        "rente_values": list(rente_values),
        "belaaning_values": list(belaaning_values),
        "overskud_foer_renter": overskud_foer_renter,
        "cash_flow": cash_flow.tolist(),           # 2D liste [R][B]
        "cash_on_cash": cash_on_cash.tolist(),     # 2D liste [R][B]
    }


def default_grid() -> Tuple[np.ndarray, np.ndarray]:
    rente = np.arange(3.0, 8.01, 0.5)       # 3%..8% step 0.5
    belaaning = np.arange(60.0, 85.01, 5.0)  # 60%..85% step 5
    return rente, belaaning
