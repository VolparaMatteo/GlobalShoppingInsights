"""Test per app.utils.reading_time."""

from __future__ import annotations

import pytest

from app.utils.reading_time import compute_reading_time, compute_reading_time_optional

# ---------------------------------------------------------------------------
# compute_reading_time
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("empty", ["", None, "   ", "\n\t  \n"])
def test_returns_zero_for_empty_or_none(empty):
    assert compute_reading_time(empty) == 0


def test_single_word_rounds_up_to_one_minute():
    # Anche una sola parola → almeno 1 min (non vogliamo "0 min lettura" in UI).
    assert compute_reading_time("ciao") == 1


def test_under_threshold_still_one_minute():
    # 100 parole @ 200 wpm = 0.5 min → ceil → 1
    text = "parola " * 100
    assert compute_reading_time(text) == 1


def test_exactly_one_wpm_window_is_one_minute():
    # 200 parole @ 200 wpm = 1 min esatto
    text = "parola " * 200
    assert compute_reading_time(text) == 1


def test_just_over_one_wpm_window_rounds_up():
    # 201 parole @ 200 wpm = 1.005 → ceil → 2
    text = "parola " * 201
    assert compute_reading_time(text) == 2


def test_long_text_three_minutes():
    # 600 parole @ 200 wpm = 3 min esatti
    text = "parola " * 600
    assert compute_reading_time(text) == 3


def test_realistic_italian_paragraph():
    # Un paragrafo italiano realistico ~80 parole → 1 min
    text = (
        "Negli ultimi anni il commercio elettronico ha attraversato una "
        "trasformazione significativa, spinta dalla diffusione capillare "
        "degli smartphone e dall'evoluzione delle abitudini di consumo dei "
        "clienti. I retailer più attenti hanno saputo cogliere questa "
        "opportunità integrando piattaforme digitali, sistemi logistici "
        "avanzati e strategie omnicanale capaci di offrire esperienze fluide "
        "tanto online quanto nei punti vendita fisici, ridefinendo il "
        "concetto stesso di negozio."
    )
    assert compute_reading_time(text) == 1


def test_custom_wpm_changes_result():
    # 600 parole @ 300 wpm = 2 min
    text = "parola " * 600
    assert compute_reading_time(text, wpm=300) == 2


# ---------------------------------------------------------------------------
# compute_reading_time_optional
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("empty", ["", None, "  "])
def test_optional_returns_none_for_empty(empty):
    assert compute_reading_time_optional(empty) is None


def test_optional_returns_minutes_for_real_text():
    text = "parola " * 400
    assert compute_reading_time_optional(text) == 2
