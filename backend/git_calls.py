import requests
import os
from dotenv import load_dotenv
import datetime
import time
load_dotenv(".env")




HEADERS = {
        'Authorization': f'token {os.getenv("TOKEN")}',
        'Accept': 'application/vnd.github.v3+json'
    }



# Get repo names

def get_names(username):
    api_url = f"https://api.github.com/users/{username}/repos"

    response = requests.get(api_url,headers=HEADERS)

    return_list = []
    if response.status_code == 200:
        repos = response.json()
        for repo in repos:
            return_list.append(repo['name'])
    else:
        print(f"Failed to retrieve repositories. Status code: {response.status_code}")
        print(f"Error message: {response.text}")

    return return_list


def paginated_get(url, headers, params=None):

    if params is None:
        params = {}
    params["per_page"] = 100

    all_items = []
    page = 1

    while True:
        params["page"] = page
        response = requests.get(url, headers=headers, params=params)

        if response.status_code != 200:
            print(f"Error on page {page}: {response.status_code}")
            break

        items = response.json()
        if not items:
            break

        all_items.extend(items)

        link_header = response.headers.get("Link", "")
        if 'rel="next"' not in link_header:
            break

        page += 1

    return all_items


def rate_limited_get(url, headers, params=None):

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 403:
        remaining = int(response.headers.get("X-RateLimit-Remaining", 0))
        if remaining == 0:
            reset_time = int(response.headers.get("X-RateLimit-Reset", 0))
            wait = max(reset_time - int(time.time()), 1)
            print(f"Rate limited. Waiting {wait} seconds...")
            time.sleep(wait)
            response = requests.get(url, headers=headers, params=params)

    return response



def get_commits_for_year(owner, repo, year):
   
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"

    since = datetime.datetime(year, 1, 1, 0, 0, 0).isoformat() + "Z"
    until = datetime.datetime(year, 12, 31, 23, 59, 59).isoformat() + "Z"

    params = {"since": since, "until": until}
    commits = paginated_get(url, HEADERS, params)



    return len(commits)



# get totals
def get_total(user, year):

    list_repos = get_names(user)

    for i in list_repos:
        print(i, get_commits_for_year(user, i, year))

    return None


# get_total(OWNER, 2026)





# print(get_total_with_interval(OWNER,2022,2025))




def get_prs_for_year(owner, repo, year):
   
    url = "https://api.github.com/search/issues"
    query = f"repo:{owner}/{repo} is:pr created:{year}-01-01..{year}-12-31"
    params = {"q": query}

    response = rate_limited_get(url, HEADERS, params=params)

    if response.status_code == 200:
        data = response.json()
       
        return data["total_count"]
    else:
        print(f"Error {response.status_code}: {response.text}")
        return None
    

def get_merges_for_year(owner, repo, year):

    url = "https://api.github.com/search/issues"
    query = f"repo:{owner}/{repo} is:pr is:merged merged:{year}-01-01..{year}-12-31"
    params = {"q": query}

    response = rate_limited_get(url, HEADERS, params=params)

    if response.status_code == 200:
        data = response.json()
        return data["total_count"]
    else:
        print(f"Error {response.status_code}: {response.text}")
        return None
    


def get_issues_for_year(owner, repo, year):
    url = "https://api.github.com/search/issues"
    query = f"repo:{owner}/{repo} is:issue created:{year}-01-01..{year}-12-31"
    params = {"q": query}

    response = rate_limited_get(url, HEADERS, params=params)

    if response.status_code == 200:
        return response.json()["total_count"]
    return None



def get_code_frequency_for_year(owner, repo, year):
   
    url = f"https://api.github.com/repos/{owner}/{repo}/stats/code_frequency"
    response = requests.get(url, headers=HEADERS)

    max_retries = 5
    for attempt in range(max_retries):
        response = requests.get(url, headers=HEADERS)
        
        if response.status_code == 200:
            break  
        elif response.status_code == 202:
            time.sleep(2)  
            continue
        else:
            print(f"Error {response.status_code}: {response.text}")
            return None, None

    data = response.json()

    total_additions = 0
    total_deletions = 0

    for week in data:
        timestamp, additions, deletions = week
        week_date = datetime.datetime.fromtimestamp(timestamp, datetime.UTC)
        if week_date.year == year:
            total_additions += additions
            total_deletions += abs(deletions)  

    return [total_additions, total_deletions]

def get_all_stats_for_year(username, year):
 
    repos = get_names(username)

    

    totals = {"commits": 0, "prs": 0, "merges": 0, "issues": 0}
    obj = {}

    for repo in repos:

        temp = {"commits": 0, "prs": 0, "merges": 0, "issues": 0}

        commits = get_commits_for_year(username,repo,year) or 0
        prs     = get_prs_for_year(username, repo, year) or 0
        merges  = get_merges_for_year(username, repo, year) or 0
        issues  = get_issues_for_year(username, repo, year) or 0
      
        


        totals["commits"] += commits
        temp["commits"] += commits
        totals["prs"]     += prs
        temp["prs"]     += prs
        totals["merges"]  += merges
        temp["merges"]  += merges
        totals["issues"]  += issues
        temp["issues"]  += issues



        


        obj[repo] = temp


    return obj, totals


def get_all_freq(username,year):

    repos = get_names(username)

    obj = {}
    for repo in repos:
        freq = get_code_frequency_for_year(username,repo,year)
        obj[repo] = freq

    return obj



def print_stats(obj):

    print(f"\n{'Repo':<35} {'Commits':>8} {'PRs':>6} {'Merges':>7} {'Issues':>7}")
    print("-" * 70)

    totals = {"commits": 0, "prs": 0, "merges": 0, "issues": 0}
    for i in obj:

        print(f"{i:<35} {obj[i]["commits"]:>8} {obj[i]["prs"]:>6} {obj[i]["merges"]:>7} {obj[i]["issues"]:>7}")

        totals["commits"] += obj[i]["commits"]
        totals["prs"]     += obj[i]["prs"]
        totals["merges"]  += obj[i]["merges"]
        totals["issues"]  += obj[i]["issues"]
    

    print("-" * 70)
    print(f"{'TOTAL':<35} {totals['commits']:>8} {totals['prs']:>6} {totals['merges']:>7} {totals['issues']:>7}")

    return None






