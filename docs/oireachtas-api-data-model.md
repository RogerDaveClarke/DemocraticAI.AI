# Oireachtas API � Data Model
_Updated: 2026-08-08_

Entity-relationship model of the Oireachtas API as consumed by the Parliament AI ingestion pipeline. Two views are provided: the full model including legislation, and a focused votes and debates view.

For endpoint documentation and request/response schemas see `docs/oireachtas-api-reference.md`.

---

## Full model � legislation, debates, votes, and questions

```mermaid
erDiagram
    MEMBER {
      string memberCode
      string showAs
      string uri
    }

    HOUSE {
      string houseCode
      string houseNo
      string chamberType
      string committeeCode
      string showAs
      string uri
    }

    %% Legislation domain
    BILL {
      string billNo
      string billType
      string showAs
      string uri
      string originatingHouseCode
      date   introducedDate
      boolean isGovernmentBill
      boolean isPrivateMembersBill
    }

    BILL_STAGE {
      string stageName
      string stageCode
      string uri
    }

    BILL_EVENT {
      string eventName
      string uri
      date   date
    }

    ACT {
      string actNo
      string year
      string showAs
      string uri
    }

    SUBJECT {
      string showAs
      string uri
    }

    DIVISION {
      datetime datetime
      string category
      string outcome
      string voteId
      boolean isBill
      string uri
    }

    VOTE_TALLY_SUMMARY {
      int taCount
      int nilCount
      int staonCount
    }

    MEMBER_TALLY {
      string voteType
    }

    DEBATE_RECORD {
      date date
      string debateType
      string uri
      datetime lastUpdated
    }

    DEBATE_SECTION {
      string debateSectionId
      string showAs
      string debateType
      boolean containsDebate
      string uri
    }

    QUESTION {
      date date
      string questionType
      int questionNumber
      string uri
    }

    %% Questions
    MEMBER ||--o{ QUESTION : asks
    HOUSE  ||--o{ QUESTION : has
    DEBATE_SECTION ||--o{ QUESTION : references

    %% Debates
    HOUSE  ||--o{ DEBATE_RECORD : has
    DEBATE_RECORD ||--o{ DEBATE_SECTION : contains
    DEBATE_SECTION ||--o| DEBATE_SECTION : parentOf
    MEMBER }o--o{ DEBATE_SECTION : speaksIn

    %% Votes (Divisions)
    HOUSE  ||--o{ DIVISION : has
    SUBJECT ||--o{ DIVISION : about
    DEBATE_RECORD ||--o{ DIVISION : records
    DEBATE_SECTION ||--o{ DIVISION : occursIn
    DIVISION ||--|| VOTE_TALLY_SUMMARY : summarizes
    DIVISION ||--o{ MEMBER_TALLY : hasVotes
    MEMBER  ||--o{ MEMBER_TALLY : casts

    %% Legislation relationships
    HOUSE  ||--o{ BILL : originates
    BILL   ||--o{ BILL_STAGE : hasStage
    BILL_STAGE ||--o{ BILL_EVENT : hasEvent
    BILL   ||--o{ DEBATE_SECTION : debatedIn
    BILL   ||--o{ DIVISION : votedOnIn
    BILL   ||--o| ACT : becomes
    MEMBER }o--o{ BILL : sponsors
```
  
**Notes**
- Legislation flow: `BILL` → multiple `BILL_STAGE` → stage `BILL_EVENT`(s); a `BILL` may **become** an `ACT` when enacted.
- Votes on legislation: `DIVISION` can be linked to a `BILL` (where `isBill = true`) and summarized in `VOTE_TALLY_SUMMARY`; member votes appear in `MEMBER_TALLY`.
- Debates: `BILL` can be discussed within specific `DEBATE_SECTION`s of a `DEBATE_RECORD`.
- Questions: retained for completeness and cross-link to debates/sections when provided.

---

## Focused view � votes and debates

Subset of the above for use cases concerned only with division and debate data.

```mermaid
erDiagram
    MEMBER {
      string memberCode
      string showAs
      string uri
    }

    HOUSE {
      string houseCode
      string houseNo
      string chamberType
      string committeeCode
      string showAs
      string uri
    }

    SUBJECT {
      string showAs
      string uri
    }

    DIVISION {
      datetime datetime
      string category
      string outcome
      string voteId
      boolean isBill
      string uri
    }

    MEMBER_TALLY {
      string voteType
    }

    VOTE_TALLY_SUMMARY {
      int taCount
      int nilCount
      int staonCount
    }

    DEBATE_RECORD {
      date date
      string debateType
      string uri
      datetime lastUpdated
    }

    DEBATE_SECTION {
      string debateSectionId
      string showAs
      string debateType
      boolean containsDebate
      string uri
    }

    %% Questions (kept for completeness)
    QUESTION {
      date date
      string questionType
      int questionNumber
      string uri
    }

    %% Questions relationships
    MEMBER ||--o{ QUESTION : asks
    HOUSE  ||--o{ QUESTION : has
    DEBATE_SECTION ||--o{ QUESTION : references

    %% Debates
    HOUSE  ||--o{ DEBATE_RECORD : has
    DEBATE_RECORD ||--o{ DEBATE_SECTION : contains
    DEBATE_SECTION ||--o| DEBATE_SECTION : parentOf
    MEMBER }o--o{ DEBATE_SECTION : speaksIn

    %% Votes (Divisions)
    HOUSE  ||--o{ DIVISION : has
    SUBJECT ||--o{ DIVISION : about
    DEBATE_RECORD ||--o{ DIVISION : records
    DEBATE_SECTION ||--o{ DIVISION : occursIn
    DIVISION ||--|| VOTE_TALLY_SUMMARY : summarizes
    DIVISION ||--o{ MEMBER_TALLY : hasVotes
    MEMBER  ||--o{ MEMBER_TALLY : casts
```
  
**Notes**
- `MEMBER_TALLY.voteType` values are typically “Tá”, “Níl”, and “Staon”.
- `VOTE_TALLY_SUMMARY` captures division-level totals derived from `tallies.taVotes.tally`, `tallies.nilVotes.tally`, and `tallies.staonVotes.tally`.
- `SUBJECT` represents the motion text shown as part of a division (e.g., “Question put: ...”).
- A division may appear in the context of a `DEBATE_RECORD` and specific `DEBATE_SECTION`.