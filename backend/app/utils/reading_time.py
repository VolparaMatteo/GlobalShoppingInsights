"""Stima del tempo di lettura.

Convenzione editoriale GSI: 200 parole/minuto in italiano. Più prudente
del 265 wpm di Medium per l'inglese — l'italiano ha parole più lunghe e
proposizioni più articolate, 200 wpm restituisce stime fedeli per un
lettore medio adulto.

Esposto come funzione pura: chi consuma il valore (schema Article,
componenti UI) decide se renderizzarlo, formattarlo, omettere lo zero.
"""

from __future__ import annotations

import math

DEFAULT_WPM = 200


def compute_reading_time(text: str | None, wpm: int = DEFAULT_WPM) -> int:
    """Minuti di lettura per `text`, arrotondati per eccesso.

    Returns 0 se il testo è vuoto / None / solo whitespace. Altrimenti
    almeno 1, anche per testi di poche parole (l'utente ha comunque
    bisogno di un istante per leggere).
    """
    if not text:
        return 0
    word_count = len(text.split())
    if word_count == 0:
        return 0
    return max(1, math.ceil(word_count / wpm))


def compute_reading_time_optional(text: str | None, wpm: int = DEFAULT_WPM) -> int | None:
    """Variante che restituisce None invece di 0.

    Usata per campi opzionali (es. published_excerpt): se l'estratto non
    è ancora stato generato, vogliamo un null nello schema, non uno 0
    che a UI verrebbe renderizzato come "0 min".
    """
    minutes = compute_reading_time(text, wpm)
    return minutes if minutes > 0 else None
