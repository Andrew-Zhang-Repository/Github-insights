from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
import git_calls
from fastapi.staticfiles import StaticFiles

load_dotenv(".env")

app = FastAPI()

origins = [
    os.getenv('SERVER1'),
    os.getenv('SERVER2'),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LinkRequest(BaseModel):
    url: str

class StatsRequest(BaseModel):
    username: str
    year: int


@app.get("/api/message")
async def get_link():

    return {"App is healthy": 200}


@app.post("/api/link")
async def get_link(body: LinkRequest):
    parsed = urlparse(body.url)
    path = parsed.path.strip("/")

    if not path:
        raise HTTPException(status_code=400, detail="Could not parse username from URL")

    username = path.split("/")[0]

    repos = git_calls.get_names(username)
    if not repos and repos is not None:
        return {"username": username, "repos": []}

    return {"username": username, "repos": repos}



@app.post("/api/send_obj")
async def send_obj(body: StatsRequest):
    stats, totals = git_calls.get_all_stats_for_year(body.username, body.year)
    return {"stats": stats, "totals": totals}


@app.post("/api/send_obj_freq")
async def send_freqobj(body: StatsRequest):
    freq = git_calls.get_all_freq(body.username, body.year)
    return {"freq": freq}


static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="spa")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
