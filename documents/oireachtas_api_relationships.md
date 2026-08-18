# Oireachtas API – Entity Relationships (with Votes)

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
