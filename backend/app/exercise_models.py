from typing import Literal

from pydantic import BaseModel, Field


Lang = Literal["de", "en"]


class PayoffCell(BaseModel):
    row: str
    col: str
    u1: int
    u2: int


class NormalFormGame(BaseModel):
    rows: list[str] = Field(..., min_length=1)
    cols: list[str] = Field(..., min_length=1)
    payoffs: list[PayoffCell] = Field(..., min_length=1)


class Choice(BaseModel):
    id: str
    label: str


class Ex1Question(BaseModel):
    responder: Literal[1, 2]
    opp: str


class Ex1NewResponse(BaseModel):
    game: NormalFormGame
    question: Ex1Question
    choices: list[Choice]


class Ex1CheckRequest(BaseModel):
    game: NormalFormGame
    question: Ex1Question
    selected_choice_id: str
    lang: Lang = "de"


class Ex1CheckResponse(BaseModel):
    correct: bool
    correct_choice_id: str
    correct_label: str
    feedback: str


class Ex2NewResponse(BaseModel):
    game: NormalFormGame
    choices: list[Choice]


class Ex2CheckRequest(BaseModel):
    game: NormalFormGame
    selected_choice_id: str
    lang: Lang = "de"


class Ex2CheckResponse(BaseModel):
    correct: bool
    correct_choice_id: str
    correct_label: str
    explanation: str
    feedback: str


class Ex3NewResponse(BaseModel):
    game: NormalFormGame
    choices: list[Choice]


class Ex3CheckRequest(BaseModel):
    game: NormalFormGame
    selected_choice_id: str
    lang: Lang = "de"


class Ex3CheckResponse(BaseModel):
    correct: bool
    correct_choice_id: str
    correct_label: str
    explanation: str
    feedback: str


class Ex4NewResponse(BaseModel):
    game: NormalFormGame
    choices: list[Choice]


class Ex4CheckRequest(BaseModel):
    game: NormalFormGame
    selected_choice_ids: list[str] = Field(default_factory=list)
    lang: Lang = "de"


class Ex4CheckResponse(BaseModel):
    correct: bool
    correct_choice_ids: list[str]
    correct_text: str
    explanation: str
    feedback: str


class Ex5CellAnswer(BaseModel):
    row: str
    col: str
    value: Literal["no", "yes_not_strict", "yes_strict"]


class Ex5NewResponse(BaseModel):
    game: NormalFormGame
    cell_choices: list[Choice]


class Ex5CheckRequest(BaseModel):
    game: NormalFormGame
    answers: list[Ex5CellAnswer]
    lang: Lang = "de"


class Ex5CheckResponse(BaseModel):
    correct: bool
    missing: int
    wrong: int
    feedback: str


class Ex6NewResponse(BaseModel):
    game: NormalFormGame
    choices: list[Choice]


class Ex6CheckRequest(BaseModel):
    game: NormalFormGame
    selected_choice_id: str
    lang: Lang = "de"


class Ex6CheckResponse(BaseModel):
    correct: bool
    correct_choice_id: str
    feedback: str


class Ex7NewResponse(BaseModel):
    game: NormalFormGame
    choices: list[Choice]


class Ex7CheckRequest(BaseModel):
    game: NormalFormGame
    selected_choice_ids: list[str] = Field(default_factory=list)
    lang: Lang = "de"


class Ex7CheckResponse(BaseModel):
    correct: bool
    correct_choice_ids: list[str]
    feedback: str
    details: str


class Ex8NewResponse(BaseModel):
    game: NormalFormGame
    choices: list[Choice]


class Ex8CheckRequest(BaseModel):
    game: NormalFormGame
    selected_choice_ids: list[str] = Field(default_factory=list)
    lang: Lang = "de"


class Ex8CheckResponse(BaseModel):
    correct: bool
    correct_choice_ids: list[str]
    feedback: str
    details: str


class Ex9NewResponse(BaseModel):
    game: NormalFormGame
    a: int
    choices: list[Choice]


class Ex9CheckRequest(BaseModel):
    game: NormalFormGame
    a: int
    selected_choice_id: str
    lang: Lang = "de"


class Ex9CheckResponse(BaseModel):
    correct: bool
    correct_choice_id: str
    correct_text: str
    feedback: str


class BayesEx1NewResponse(BaseModel):
    game_t1: NormalFormGame
    game_t2: NormalFormGame
    params: dict[str, int]
    choices: list[Choice]


class BayesEx1CheckRequest(BaseModel):
    params: dict[str, int]
    selected_choice_ids: list[str] = Field(default_factory=list)
    lang: Lang = "de"


class BayesEx1CheckResponse(BaseModel):
    correct: bool
    correct_choice_ids: list[str]
    feedback: str


class BayesEx2Params(BaseModel):
    den: int
    w: int
    x: int
    y: int
    z: int


class BayesEx2aNewResponse(BaseModel):
    params: BayesEx2Params
    choices: list[Choice]


class BayesEx2aCheckRequest(BaseModel):
    params: BayesEx2Params
    selected_choice_id: str
    lang: Lang = "de"


class BayesEx2aCheckResponse(BaseModel):
    correct: bool
    correct_choice_id: str
    feedback: str
    intermediate: str


class BayesEx2bNewResponse(BaseModel):
    params: BayesEx2Params
    alt_key: Literal["ab_xy", "ba_xx", "bb_yx"]
    choices: list[Choice]


class BayesEx2bCheckRequest(BaseModel):
    params: BayesEx2Params
    alt_key: Literal["ab_xy", "ba_xx", "bb_yx"]
    selected_choice_ids: list[str] = Field(default_factory=list)
    lang: Lang = "de"


class BayesEx2bCheckResponse(BaseModel):
    correct: bool
    correct_choice_ids: list[str]
    feedback: str
    details: str
