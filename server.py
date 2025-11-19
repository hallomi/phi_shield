# server.py
import json
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="PHI Drift Monitor - Backend")

QUERIES_PATH = Path("backend/queries.jsonl")
ANSWERS_PATH = Path("backend/answers.jsonl")
PATIENT_UPDATES_PATH = Path("backend/patient_updates.jsonl")  # <--- NEW


class QueryRequest(BaseModel):
    user_id: str
    patient_id: str
    question: str


class QueryResponse(BaseModel):
    user_id: str
    patient_id: str
    question: str
    answer: str


class AgeUpdateResponse(BaseModel):  # <--- NEW
    user_id: str
    patient_id: str
    question: str
    status: str
    new_age: Optional[int] = None
    message: str


def append_query(user_id: str, patient_id: str, question: str) -> None:
    """Append the query as one JSON line to queries.jsonl."""
    payload = {
        "user_id": user_id,
        "patient_id": patient_id,
        "question": question,
    }
    with QUERIES_PATH.open("a") as f:
        f.write(json.dumps(payload) + "\n")


def wait_for_answer(
    user_id: str,
    patient_id: str,
    question: str,
    timeout_seconds: float = 20.0,
    poll_interval: float = 0.5,
) -> Optional[str]:
    """
    Tail answers.jsonl and wait for the first new line that matches
    (user_id, patient_id, question). Returns answer string or None on timeout.
    """
    start_time = time.time()

    
    while not ANSWERS_PATH.exists() and time.time() - start_time < timeout_seconds:
        time.sleep(poll_interval)

    if not ANSWERS_PATH.exists():
        return None

    
    with ANSWERS_PATH.open("r") as f:
        f.seek(0, 2)  # move to end

        while time.time() - start_time < timeout_seconds:
            pos_before = f.tell()
            line = f.readline()

            if not line:
                # No new line yet, wait and retry
                time.sleep(poll_interval)
                f.seek(pos_before)
                continue

            line = line.strip()
            if not line:
                continue

            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                # skip malformed line
                continue

            # Expect at least these fields; ignore extras
            if (
                obj.get("user_id") == user_id
                and obj.get("patient_id") == patient_id
                and obj.get("question") == question
            ):
                return obj.get("answer")

        # Timeout
        return None


def wait_for_patient_update(
    user_id: str,
    patient_id: str,
    timeout_seconds: float = 20.0,
    poll_interval: float = 0.5,
) -> Optional[dict]:
    """
    Tail patient_updates.jsonl and wait for the first new line that matches
    (user_id, patient_id) and has a new_age field.
    Returns the parsed JSON dict or None on timeout.
    """
    start_time = time.time()

    
    while not PATIENT_UPDATES_PATH.exists() and time.time() - start_time < timeout_seconds:
        time.sleep(poll_interval)

    if not PATIENT_UPDATES_PATH.exists():
        return None

    with PATIENT_UPDATES_PATH.open("r") as f:
        f.seek(0, 2)  # start at end; only see new events

        while time.time() - start_time < timeout_seconds:
            pos_before = f.tell()
            line = f.readline()

            if not line:
                time.sleep(poll_interval)
                f.seek(pos_before)
                continue

            line = line.strip()
            if not line:
                continue

            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            if (
                obj.get("user_id") == user_id
                and obj.get("patient_id") == patient_id
                and "new_age" in obj
            ):
                return obj

        return None


@app.post("/ask", response_model=QueryResponse)
def ask(request: QueryRequest):
    """
    1) Append query to queries.jsonl (so Pathway sees it)
    2) Wait for Pathway to write matching answer to answers.jsonl
    3) Return that answer to the frontend
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="question cannot be empty")

   
    append_query(request.user_id, request.patient_id, request.question)

    
    answer = wait_for_answer(
        user_id=request.user_id,
        patient_id=request.patient_id,
        question=request.question,
    )

    if answer is None:
        raise HTTPException(
            status_code=504,
            detail="Timed out waiting for answer from Pathway / LLM.",
        )

    
    return QueryResponse(
        user_id=request.user_id,
        patient_id=request.patient_id,
        question=request.question,
        answer=answer,
    )


@app.post("/update-age", response_model=AgeUpdateResponse)
def update_age(request: QueryRequest):
    """
    Specialized endpoint for queries like:
    "Update this patient's age to 40."

    1) Append query to queries.jsonl
    2) Wait for Pathway to emit a matching event in patient_updates.jsonl
    3) Return a confirmation payload with new_age
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="question cannot be empty")

    
    append_query(request.user_id, request.patient_id, request.question)

    
    event = wait_for_patient_update(
        user_id=request.user_id,
        patient_id=request.patient_id,
    )

    if event is None:
        raise HTTPException(
            status_code=504,
            detail="Timed out waiting for age update event from Pathway.",
        )

    new_age = event.get("new_age")

    return AgeUpdateResponse(
        user_id=request.user_id,
        patient_id=request.patient_id,
        question=request.question,
        status="updated",
        new_age=new_age,
        message=f"Patient {request.patient_id} age updated to {new_age}.",
    )
