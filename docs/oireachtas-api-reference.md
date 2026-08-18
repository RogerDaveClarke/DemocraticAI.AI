# Oireachtas API Reference
_Source: api.oireachtas.ie/v1_

Endpoint documentation and example request/response schemas for the Oireachtas Open Data API. Used as primary data source by the Parliament AI ingestion pipeline.

For entity-relationship diagrams see `docs/oireachtas-api-data-model.md`.

---

Questions
API https://api.oireachtas.ie/v1/questions?
Parameters
date_start (Greater Than or Equal To) - question.date
date_end (Less Than or Equal To) - question.date
skip - this will ignore the first x number of records set in the parameter
limit - this will only return a specific amount of records
qtype - question.questionType Values are either oral and or written
member_id - question.by.uri
question_id - question.uri
question_no - question.questionNumber
Example
{
  "head": {
    "counts": {
      "questionCount": 10000,
      "resultCount": 10000
    }
  },
  "results": [
    {
      "question": {
        "to": {
          "showAs": "Taoiseach",
          "roleType": null,
          "roleCode": null,
          "uri": null
        },
        "date": "2025-10-14",
        "showAs": " 1. Deputy Malcolm Byrne asked the Taoiseach when the Cabinet committee on the economy, trade and competitiveness will next meet. [46519/25] ",
        "questionType": "oral",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/question/2025-10-14/pq_1",
        "questionNumber": 1,
        "house": {
          "committeeCode": "",
          "showAs": "34th Dáil",
          "chamberType": "house",
          "houseCode": "dail",
          "houseNo": "34",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/34"
        },
        "debateSection": {
          "showAs": "Cabinet Committees",
          "formats": {
            "xml": {
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-14/debate/mul@/dbsect_11.xml"
            },
            "pdf": null
          },
          "debateSectionId": "dbsect_11",
          "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-14/debate/dbsect_11"
        },
        "by": {
          "showAs": "Malcolm Byrne",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Malcolm-Byrne.D.2019-11-29",
          "memberCode": "Malcolm-Byrne.D.2019-11-29"
        }
      },
      "contextDate": "2025-10-14"
    }
  ]
}


Votes
API: https://api.oireachtas.ie/v1/votes
Parameter
chamber_type - division.house.chamberType Values can be (house or committee)
chamber_id - division.house.uri
chamber - division.house.houseCode Values can be Dail or Seanad
date_start (Greater Than or Equal To) - bill.mostRecentStage.event.dates.date
date_end (Less Than or Equal To) - bill.mostRecentStage.event.dates.date
skip - this will ignore the first x number of records set in the parameter
limit - this will only return a specific amount of records
outcome - division.outcome values can be Carried or Lost
member_id - division.memberTally.member.uri
debate_id - division.debate.uri
vote_id - division.uri

Example
{
  "head": {
    "counts": {
      "divisionCount": 10000,
      "resultCount": 10000
    }
  },
  "results": [
    {
      "division": {
        "isBill": false,
        "tellers": "Tellers: Tá, Deputies Mary Butler and Emer Currie; Níl, Deputies Pádraig Mac Lochlainn and Duncan Smith.",
        "datetime": "2025-10-15T09:00:00+01:00",
        "category": "Division",
        "outcome": "Carried",
        "chamber": {
          "showAs": "Dáil Éireann",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
        },
        "subject": {
          "showAs": "Question put: \"That the business proposal be agreed to.\"",
          "uri": null
        },
        "voteId": "vote_147",
        "tallies": {
          "nilVotes": {
            "tally": 55,
            "showAs": "Níl",
            "members": [
              {
                "member": {
                  "memberCode": "Ciarán-Ahern.D.2024-11-29",
                  "showAs": "Ahern, Ciarán.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Ciarán-Ahern.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Ivana-Bacik.S.2007-07-23",
                  "showAs": "Bacik, Ivana.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Ivana-Bacik.S.2007-07-23"
                }
              },
              {
                "member": {
                  "memberCode": "Cathy-Bennett.D.2024-11-29",
                  "showAs": "Bennett, Cathy.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Cathy-Bennett.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "John-Brady.D.2016-10-03",
                  "showAs": "Brady, John.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/John-Brady.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Pat-Buckley.D.2016-10-03",
                  "showAs": "Buckley, Pat.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Pat-Buckley.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Holly-Cairns.D.2020-02-08",
                  "showAs": "Cairns, Holly.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Holly-Cairns.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Matt-Carthy.D.2020-02-08",
                  "showAs": "Carthy, Matt.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Matt-Carthy.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Sorca-Clarke.D.2020-02-08",
                  "showAs": "Clarke, Sorca.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Sorca-Clarke.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Michael-Collins.D.2016-10-03",
                  "showAs": "Collins, Michael.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Michael-Collins.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Rose-Conway-Walsh.S.2016-04-25",
                  "showAs": "Conway-Walsh, Rose.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Rose-Conway-Walsh.S.2016-04-25"
                }
              },
              {
                "member": {
                  "memberCode": "Réada-Cronin.D.2020-02-08",
                  "showAs": "Cronin, Réada.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Réada-Cronin.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Seán-Crowe.D.2002-06-06",
                  "showAs": "Crowe, Seán.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Seán-Crowe.D.2002-06-06"
                }
              },
              {
                "member": {
                  "memberCode": "David-Cullinane.S.2011-05-25",
                  "showAs": "Cullinane, David.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/David-Cullinane.S.2011-05-25"
                }
              },
              {
                "member": {
                  "memberCode": "Jen-Cummins.D.2024-11-29",
                  "showAs": "Cummins, Jen.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Jen-Cummins.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Pa-Daly.D.2020-02-08",
                  "showAs": "Daly, Pa.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Pa-Daly.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Paul-Donnelly.D.2020-02-08",
                  "showAs": "Donnelly, Paul.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Paul-Donnelly.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Aidan-Farrelly.D.2024-11-29",
                  "showAs": "Farrelly, Aidan.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Aidan-Farrelly.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Mairéad-Farrell.D.2020-02-08",
                  "showAs": "Farrell, Mairéad.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Mairéad-Farrell.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Sinéad-Gibney.D.2024-11-29",
                  "showAs": "Gibney, Sinéad.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Sinéad-Gibney.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Thomas-Gould.D.2020-02-08",
                  "showAs": "Gould, Thomas.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Thomas-Gould.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Ann-Graves.D.2024-11-29",
                  "showAs": "Graves, Ann.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Ann-Graves.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Eoin-Hayes.D.2024-11-29",
                  "showAs": "Hayes, Eoin.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Eoin-Hayes.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Rory-Hearne.D.2024-11-29",
                  "showAs": "Hearne, Rory.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Rory-Hearne.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Alan-Kelly.S.2007-07-23",
                  "showAs": "Kelly, Alan.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Alan-Kelly.S.2007-07-23"
                }
              },
              {
                "member": {
                  "memberCode": "Martin-Kenny.D.2016-10-03",
                  "showAs": "Kenny, Martin.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Martin-Kenny.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Claire-Kerrane.D.2020-02-08",
                  "showAs": "Kerrane, Claire.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Claire-Kerrane.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Paul-Lawless.D.2024-11-29",
                  "showAs": "Lawless, Paul.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Paul-Lawless.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "George-Lawlor.D.2024-11-29",
                  "showAs": "Lawlor, George.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/George-Lawlor.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Pádraig-MacLochlainn.D.2011-03-09",
                  "showAs": "Mac Lochlainn, Pádraig.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Pádraig-MacLochlainn.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Donna-McGettigan.D.2024-11-29",
                  "showAs": "McGettigan, Donna.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Donna-McGettigan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Conor-D-McGuinness.D.2024-11-29",
                  "showAs": "McGuinness, Conor D.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Conor-D-McGuinness.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Denise-Mitchell.D.2016-10-03",
                  "showAs": "Mitchell, Denise.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Denise-Mitchell.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Paul-Murphy.D.2014-10-10",
                  "showAs": "Murphy, Paul.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Paul-Murphy.D.2014-10-10"
                }
              },
              {
                "member": {
                  "memberCode": "Johnny-Mythen.D.2020-02-08",
                  "showAs": "Mythen, Johnny.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Johnny-Mythen.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Natasha-Newsome-Drennan.D.2024-11-29",
                  "showAs": "Newsome Drennan, Natasha.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Natasha-Newsome-Drennan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Shónagh-Ní-Raghallaigh.D.2024-11-29",
                  "showAs": "Ní Raghallaigh, Shónagh.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Shónagh-Ní-Raghallaigh.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Cian-O'Callaghan.D.2020-02-08",
                  "showAs": "O'Callaghan, Cian.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Cian-O'Callaghan.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Robert-O'Donoghue.D.2024-11-29",
                  "showAs": "O'Donoghue, Robert.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Robert-O'Donoghue.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Ken-O'Flynn.D.2024-11-29",
                  "showAs": "O'Flynn, Ken.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Ken-O'Flynn.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Roderic-O'Gorman.D.2020-02-08",
                  "showAs": "O'Gorman, Roderic.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Roderic-O'Gorman.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Louis-O'Hara.D.2024-11-29",
                  "showAs": "O'Hara, Louis.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Louis-O'Hara.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Louise-O'Reilly.D.2016-10-03",
                  "showAs": "O'Reilly, Louise.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Louise-O'Reilly.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Eoin-Ó-Broin.D.2016-10-03",
                  "showAs": "Ó Broin, Eoin.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Eoin-Ó-Broin.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Donnchadh-Ó-Laoghaire.D.2016-10-03",
                  "showAs": "Ó Laoghaire, Donnchadh.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Donnchadh-Ó-Laoghaire.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Ruairí-Ó-Murchú.D.2020-02-08",
                  "showAs": "Ó Murchú, Ruairí.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Ruairí-Ó-Murchú.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Aengus-Ó-Snodaigh.D.2002-06-06",
                  "showAs": "Ó Snodaigh, Aengus.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Aengus-Ó-Snodaigh.D.2002-06-06"
                }
              },
              {
                "member": {
                  "memberCode": "Fionntán-Ó-Súilleabháin.D.2024-11-29",
                  "showAs": "Ó Súilleabháin, Fionntán.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Fionntán-Ó-Súilleabháin.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Maurice-Quinlivan.D.2016-10-03",
                  "showAs": "Quinlivan, Maurice.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Maurice-Quinlivan.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Pádraig-Rice.D.2024-11-29",
                  "showAs": "Rice, Pádraig.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Pádraig-Rice.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Conor-Sheehan.D.2024-11-29",
                  "showAs": "Sheehan, Conor.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Conor-Sheehan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Marie-Sherlock.S.2020-03-30",
                  "showAs": "Sherlock, Marie.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Marie-Sherlock.S.2020-03-30"
                }
              },
              {
                "member": {
                  "memberCode": "Duncan-Smith.D.2020-02-08",
                  "showAs": "Smith, Duncan.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Duncan-Smith.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Peadar-Tóibín.D.2011-03-09",
                  "showAs": "Tóibín, Peadar.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Peadar-Tóibín.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Mark-Wall.S.2020-03-30",
                  "showAs": "Wall, Mark.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Mark-Wall.S.2020-03-30"
                }
              },
              {
                "member": {
                  "memberCode": "Mark-Ward.D.2019-11-29",
                  "showAs": "Ward, Mark.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Mark-Ward.D.2019-11-29"
                }
              }
            ]
          },
          "staonVotes": {
            "tally": 1,
            "showAs": "Staon",
            "members": [
              {
                "member": {
                  "memberCode": "Paul-Nicholas-Gogarty.D.2002-06-06",
                  "showAs": "Gogarty, Paul Nicholas.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Paul-Nicholas-Gogarty.D.2002-06-06"
                }
              }
            ]
          },
          "taVotes": {
            "tally": 90,
            "showAs": "Tá",
            "members": [
              {
                "member": {
                  "memberCode": "William-Aird.D.2024-11-29",
                  "showAs": "Aird, William.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/William-Aird.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Catherine-Ardagh.S.2016-04-25",
                  "showAs": "Ardagh, Catherine.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Catherine-Ardagh.S.2016-04-25"
                }
              },
              {
                "member": {
                  "memberCode": "Grace-Boland.D.2024-11-29",
                  "showAs": "Boland, Grace.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Grace-Boland.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Tom-Brabazon.D.2024-11-29",
                  "showAs": "Brabazon, Tom.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Tom-Brabazon.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Brian-Brennan.D.2024-11-29",
                  "showAs": "Brennan, Brian.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Brian-Brennan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Shay-Brennan.D.2024-11-29",
                  "showAs": "Brennan, Shay.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Shay-Brennan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "James-Browne.D.2016-10-03",
                  "showAs": "Browne, James.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/James-Browne.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Colm-Burke.S.2011-05-25",
                  "showAs": "Burke, Colm.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Colm-Burke.S.2011-05-25"
                }
              },
              {
                "member": {
                  "memberCode": "Peter-Burke.D.2016-10-03",
                  "showAs": "Burke, Peter.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Peter-Burke.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Mary-Butler.D.2016-10-03",
                  "showAs": "Butler, Mary.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Mary-Butler.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Jerry-Buttimer.S.2007-07-23",
                  "showAs": "Buttimer, Jerry.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Jerry-Buttimer.S.2007-07-23"
                }
              },
              {
                "member": {
                  "memberCode": "Malcolm-Byrne.D.2019-11-29",
                  "showAs": "Byrne, Malcolm.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Malcolm-Byrne.D.2019-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Thomas-Byrne.D.2007-06-14",
                  "showAs": "Byrne, Thomas.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Thomas-Byrne.D.2007-06-14"
                }
              },
              {
                "member": {
                  "memberCode": "Michael-Cahill.D.2024-11-29",
                  "showAs": "Cahill, Michael.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Michael-Cahill.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Catherine-Callaghan.D.2024-11-29",
                  "showAs": "Callaghan, Catherine.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Catherine-Callaghan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Dara-Calleary.D.2007-06-14",
                  "showAs": "Calleary, Dara.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Dara-Calleary.D.2007-06-14"
                }
              },
              {
                "member": {
                  "memberCode": "Seán-Canney.D.2016-10-03",
                  "showAs": "Canney, Seán.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Seán-Canney.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Micheál-Carrigy.S.2020-03-30",
                  "showAs": "Carrigy, Micheál.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Micheál-Carrigy.S.2020-03-30"
                }
              },
              {
                "member": {
                  "memberCode": "Jennifer-Carroll-MacNeill.D.2020-02-08",
                  "showAs": "Carroll MacNeill, Jennifer.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Jennifer-Carroll-MacNeill.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Jack-Chambers.D.2016-10-03",
                  "showAs": "Chambers, Jack.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Jack-Chambers.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Peter-'Chap'-Cleere.D.2024-11-29",
                  "showAs": "Cleere, Peter 'Chap'.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Peter-'Chap'-Cleere.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "John-Clendennen.D.2024-11-29",
                  "showAs": "Clendennen, John.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/John-Clendennen.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Niall-Collins.D.2007-06-14",
                  "showAs": "Collins, Niall.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Niall-Collins.D.2007-06-14"
                }
              },
              {
                "member": {
                  "memberCode": "John-Connolly.D.2024-11-29",
                  "showAs": "Connolly, John.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/John-Connolly.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Joe-Cooney.D.2024-11-29",
                  "showAs": "Cooney, Joe.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Joe-Cooney.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Cathal-Crowe.D.2020-02-08",
                  "showAs": "Crowe, Cathal.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Cathal-Crowe.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "John-Cummins.S.2020-03-30",
                  "showAs": "Cummins, John.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/John-Cummins.S.2020-03-30"
                }
              },
              {
                "member": {
                  "memberCode": "Emer-Currie.S.2020-06-29",
                  "showAs": "Currie, Emer.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Emer-Currie.S.2020-06-29"
                }
              },
              {
                "member": {
                  "memberCode": "Martin-Daly.D.2024-11-29",
                  "showAs": "Daly, Martin.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Martin-Daly.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Aisling-Dempsey.D.2024-11-29",
                  "showAs": "Dempsey, Aisling.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Aisling-Dempsey.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Cormac-Devlin.D.2020-02-08",
                  "showAs": "Devlin, Cormac.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Cormac-Devlin.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Alan-Dillon.D.2020-02-08",
                  "showAs": "Dillon, Alan.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Alan-Dillon.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Albert-Dolan.D.2024-11-29",
                  "showAs": "Dolan, Albert.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Albert-Dolan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Frank-Feighan.S.2002-09-12",
                  "showAs": "Feighan, Frankie.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Frank-Feighan.S.2002-09-12"
                }
              },
              {
                "member": {
                  "memberCode": "Seán-Fleming.D.1997-06-26",
                  "showAs": "Fleming, Seán.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Seán-Fleming.D.1997-06-26"
                }
              },
              {
                "member": {
                  "memberCode": "Norma-Foley.D.2020-02-08",
                  "showAs": "Foley, Norma.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Norma-Foley.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Pat-the-Cope-Gallagher.D.1981-06-30",
                  "showAs": "Gallagher, Pat the Cope.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Pat-the-Cope-Gallagher.D.1981-06-30"
                }
              },
              {
                "member": {
                  "memberCode": "James-Geoghegan.D.2024-11-29",
                  "showAs": "Geoghegan, James.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/James-Geoghegan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Noel-Grealish.D.2002-06-06",
                  "showAs": "Grealish, Noel.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Noel-Grealish.D.2002-06-06"
                }
              },
              {
                "member": {
                  "memberCode": "Marian-Harkin.D.2002-06-06",
                  "showAs": "Harkin, Marian.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Marian-Harkin.D.2002-06-06"
                }
              },
              {
                "member": {
                  "memberCode": "Simon-Harris.D.2011-03-09",
                  "showAs": "Harris, Simon.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Simon-Harris.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Danny-Healy-Rae.D.2016-10-03",
                  "showAs": "Healy-Rae, Danny.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Danny-Healy-Rae.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Michael-Healy-Rae.D.2011-03-09",
                  "showAs": "Healy-Rae, Michael.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Michael-Healy-Rae.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Barry-Heneghan.D.2024-11-29",
                  "showAs": "Heneghan, Barry.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Barry-Heneghan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Martin-Heydon.D.2011-03-09",
                  "showAs": "Heydon, Martin.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Martin-Heydon.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Emer-Higgins.D.2020-02-08",
                  "showAs": "Higgins, Emer.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Emer-Higgins.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Keira-Keogh.D.2024-11-29",
                  "showAs": "Keogh, Keira.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Keira-Keogh.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "John-Lahart.D.2016-10-03",
                  "showAs": "Lahart, John.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/John-Lahart.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "James-Lawless.D.2016-10-03",
                  "showAs": "Lawless, James.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/James-Lawless.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Michael-Lowry.D.1987-03-10",
                  "showAs": "Lowry, Michael.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Michael-Lowry.D.1987-03-10"
                }
              },
              {
                "member": {
                  "memberCode": "Micheál-Martin.D.1989-06-29",
                  "showAs": "Martin, Micheál.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Micheál-Martin.D.1989-06-29"
                }
              },
              {
                "member": {
                  "memberCode": "David-Maxwell.D.2024-11-29",
                  "showAs": "Maxwell, David.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/David-Maxwell.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Paul-McAuliffe.D.2020-02-08",
                  "showAs": "McAuliffe, Paul.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Paul-McAuliffe.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Noel-McCarthy.D.2024-11-29",
                  "showAs": "McCarthy, Noel.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Noel-McCarthy.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Charlie-McConalogue.D.2011-03-09",
                  "showAs": "McConalogue, Charlie.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Charlie-McConalogue.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Tony-McCormack.D.2024-11-29",
                  "showAs": "McCormack, Tony.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Tony-McCormack.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Helen-McEntee.D.2013-03-27",
                  "showAs": "McEntee, Helen.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Helen-McEntee.D.2013-03-27"
                }
              },
              {
                "member": {
                  "memberCode": "Séamus-McGrath.D.2024-11-29",
                  "showAs": "McGrath, Séamus.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Séamus-McGrath.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Erin-McGreehan.S.2020-06-29",
                  "showAs": "McGreehan, Erin.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Erin-McGreehan.S.2020-06-29"
                }
              },
              {
                "member": {
                  "memberCode": "Kevin-Boxer-Moran.D.2016-10-03",
                  "showAs": "Moran, Kevin Boxer.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Kevin-Boxer-Moran.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Aindrias-Moynihan.D.2016-10-03",
                  "showAs": "Moynihan, Aindrias.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Aindrias-Moynihan.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Michael-Moynihan.D.1997-06-26",
                  "showAs": "Moynihan, Michael.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Michael-Moynihan.D.1997-06-26"
                }
              },
              {
                "member": {
                  "memberCode": "Shane-Moynihan.D.2024-11-29",
                  "showAs": "Moynihan, Shane.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Shane-Moynihan.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Jennifer-Murnane-O'Connor.S.2016-04-25",
                  "showAs": "Murnane O'Connor, Jennifer.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Jennifer-Murnane-O'Connor.S.2016-04-25"
                }
              },
              {
                "member": {
                  "memberCode": "Michael-Murphy.D.2024-11-29",
                  "showAs": "Murphy, Michael.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Michael-Murphy.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Hildegarde-Naughton.S.2013-07-19",
                  "showAs": "Naughton, Hildegarde.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Hildegarde-Naughton.S.2013-07-19"
                }
              },
              {
                "member": {
                  "memberCode": "Joe-Neville.D.2024-11-29",
                  "showAs": "Neville, Joe.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Joe-Neville.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Darragh-O'Brien.D.2007-06-14",
                  "showAs": "O'Brien, Darragh.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Darragh-O'Brien.D.2007-06-14"
                }
              },
              {
                "member": {
                  "memberCode": "Jim-O'Callaghan.D.2016-10-03",
                  "showAs": "O'Callaghan, Jim.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Jim-O'Callaghan.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Maeve-O'Connell.D.2024-11-29",
                  "showAs": "O'Connell, Maeve.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Maeve-O'Connell.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "James-O'Connor.D.2020-02-08",
                  "showAs": "O'Connor, James.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/James-O'Connor.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Willie-O'Dea.D.1982-03-09",
                  "showAs": "O'Dea, Willie.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Willie-O'Dea.D.1982-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Kieran-O'Donnell.D.2007-06-14",
                  "showAs": "O'Donnell, Kieran.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Kieran-O'Donnell.D.2007-06-14"
                }
              },
              {
                "member": {
                  "memberCode": "Patrick-O'Donovan.D.2011-03-09",
                  "showAs": "O'Donovan, Patrick.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Patrick-O'Donovan.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Ryan-O'Meara.D.2024-11-29",
                  "showAs": "O'Meara, Ryan.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Ryan-O'Meara.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "John-Paul-O'Shea.D.2024-11-29",
                  "showAs": "O'Shea, John Paul.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/John-Paul-O'Shea.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Christopher-O'Sullivan.D.2020-02-08",
                  "showAs": "O'Sullivan, Christopher.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Christopher-O'Sullivan.D.2020-02-08"
                }
              },
              {
                "member": {
                  "memberCode": "Pádraig-O'Sullivan.D.2019-11-29",
                  "showAs": "O'Sullivan, Pádraig.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Pádraig-O'Sullivan.D.2019-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Naoise-Ó-Cearúil.D.2024-11-29",
                  "showAs": "Ó Cearúil, Naoise.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Naoise-Ó-Cearúil.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Seán-Ó-Fearghaíl.S.2000-06-09",
                  "showAs": "Ó Fearghaíl, Seán.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Seán-Ó-Fearghaíl.S.2000-06-09"
                }
              },
              {
                "member": {
                  "memberCode": "Naoise-Ó-Muirí.D.2024-11-29",
                  "showAs": "Ó Muirí, Naoise.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Naoise-Ó-Muirí.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Neale-Richmond.S.2016-04-25",
                  "showAs": "Richmond, Neale.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Neale-Richmond.S.2016-04-25"
                }
              },
              {
                "member": {
                  "memberCode": "Peter-Roche.D.2024-11-29",
                  "showAs": "Roche, Peter.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Peter-Roche.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Eamon-Scanlon.S.2002-09-12",
                  "showAs": "Scanlon, Eamon.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Eamon-Scanlon.S.2002-09-12"
                }
              },
              {
                "member": {
                  "memberCode": "Brendan-Smith.D.1992-12-14",
                  "showAs": "Smith, Brendan.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Brendan-Smith.D.1992-12-14"
                }
              },
              {
                "member": {
                  "memberCode": "Niamh-Smyth.D.2016-10-03",
                  "showAs": "Smyth, Niamh.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Niamh-Smyth.D.2016-10-03"
                }
              },
              {
                "member": {
                  "memberCode": "Edward-Timmins.D.2024-11-29",
                  "showAs": "Timmins, Edward.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Edward-Timmins.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Gillian-Toole.D.2024-11-29",
                  "showAs": "Toole, Gillian.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Gillian-Toole.D.2024-11-29"
                }
              },
              {
                "member": {
                  "memberCode": "Robert-Troy.D.2011-03-09",
                  "showAs": "Troy, Robert.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Robert-Troy.D.2011-03-09"
                }
              },
              {
                "member": {
                  "memberCode": "Barry-Ward.S.2020-03-30",
                  "showAs": "Ward, Barry.",
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Barry-Ward.S.2020-03-30"
                }
              }
            ]
          }
        },
        "debate": {
          "debateSection": "dbsect_13",
          "formats": {
            "pdf": null,
            "xml": {
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/mul@/main.xml"
            }
          },
          "showAs": "Gnó na Dála - Business of Dáil",
          "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/main"
        },
        "voteNote": "",
        "house": {
          "showAs": "34th Dáil",
          "houseCode": "dail",
          "houseNo": "34",
          "chamberType": "house",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/34",
          "committeeCode": ""
        },
        "date": "2025-10-15",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/division/house/dail/34/2025-10-15/vote_147"
      },
      "contextDate": "2025-10-15"
    }
  ]
}


Debates
API https://api.oireachtas.ie/v1/debates?
Parameters
chamber_type - debateRecord.house.chamberType values are house or committee
chamber_id - debateRecord.house.uri
chamber - debateRecord.house.houseCode values are dail or seanad
date_start (Greater Than or Equal To) - debateRecord.date
date_end (Less Than or Equal To) - debateRecord.date
skip - this will ignore the first x number of records set in the parameter
limit - this will only return a specific amount of records
member_id - debateRecord.debateSections.debateSection.speakers.speaker
debate_id - debateRecord.uri

Example
{
  "head": {
    "counts": {
      "debateCount": 8818,
      "resultCount": 8818
    }
  },
  "results": [
    {
      "debateRecord": {
        "debateSections": [
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Ábhair Shaincheisteanna Tráthúla - Topical Issue Matters",
              "debateSectionId": "dbsect_2",
              "parentDebateSection": null,
              "debateType": "topical",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 1,
                "speakerCount": 1
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_2",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Saincheisteanna Tráthúla - Topical Issue Debate",
              "debateSectionId": "dbsect_3",
              "parentDebateSection": null,
              "debateType": "topical",
              "containsDebate": false,
              "bill": null,
              "counts": {
                "speechCount": 0,
                "speakerCount": 0
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_3",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Flood Risk Management",
              "debateSectionId": "dbsect_4",
              "parentDebateSection": {
                "showAs": "Saincheisteanna Tráthúla - Topical Issue Debate",
                "debateSectionId": "dbsect_3",
                "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_3",
                "formats": {
                  "xml": null,
                  "pdf": null
                }
              },
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 4,
                "speakerCount": 2
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_4",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Air and Water Pollution",
              "debateSectionId": "dbsect_5",
              "parentDebateSection": {
                "showAs": "Saincheisteanna Tráthúla - Topical Issue Debate",
                "debateSectionId": "dbsect_3",
                "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_3",
                "formats": {
                  "xml": null,
                  "pdf": null
                }
              },
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 4,
                "speakerCount": 2
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_5",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Schools Building Projects",
              "debateSectionId": "dbsect_6",
              "parentDebateSection": {
                "showAs": "Saincheisteanna Tráthúla - Topical Issue Debate",
                "debateSectionId": "dbsect_3",
                "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_3",
                "formats": {
                  "xml": null,
                  "pdf": null
                }
              },
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 6,
                "speakerCount": 2
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_6",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Schools Building Projects",
              "debateSectionId": "dbsect_7",
              "parentDebateSection": {
                "showAs": "Saincheisteanna Tráthúla - Topical Issue Debate",
                "debateSectionId": "dbsect_3",
                "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_3",
                "formats": {
                  "xml": null,
                  "pdf": null
                }
              },
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 16,
                "speakerCount": 8
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_7",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Special Educational Needs",
              "debateSectionId": "dbsect_8",
              "parentDebateSection": {
                "showAs": "Saincheisteanna Tráthúla - Topical Issue Debate",
                "debateSectionId": "dbsect_3",
                "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_3",
                "formats": {
                  "xml": null,
                  "pdf": null
                }
              },
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 4,
                "speakerCount": 2
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_8",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Reform of the Defective Concrete Redress Scheme: Motion [Private Members]",
              "debateSectionId": "dbsect_9",
              "parentDebateSection": null,
              "debateType": "motion",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 34,
                "speakerCount": 28
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_9",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Ceisteanna ó Cheannairí - Leaders' Questions",
              "debateSectionId": "dbsect_10",
              "parentDebateSection": null,
              "debateType": "questions",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 113,
                "speakerCount": 13
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_10",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Ceisteanna ar Pholasaí nó ar Reachtaíocht - Questions on Policy or Legislation",
              "debateSectionId": "dbsect_11",
              "parentDebateSection": null,
              "debateType": "questions",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 87,
                "speakerCount": 20
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_11",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Regulation of Drones Bill 2025: First Stage",
              "debateSectionId": "dbsect_12",
              "parentDebateSection": null,
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 5,
                "speakerCount": 3
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_12",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Gnó na Dála - Business of Dáil",
              "debateSectionId": "dbsect_13",
              "parentDebateSection": null,
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 19,
                "speakerCount": 8
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_13",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Confidence in the Tánaiste and Minister for Foreign Affairs and Trade: Motion",
              "debateSectionId": "dbsect_14",
              "parentDebateSection": null,
              "debateType": "motion",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 176,
                "speakerCount": 54
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_14",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Revised Estimates for Public Services 2025: Message from Select Committee",
              "debateSectionId": "dbsect_19",
              "parentDebateSection": null,
              "debateType": "debate",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 1,
                "speakerCount": 1
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_19",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Tillage Sector: Statements",
              "debateSectionId": "dbsect_20",
              "parentDebateSection": null,
              "debateType": "statement",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 46,
                "speakerCount": 29
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_20",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Financial Resolutions 2025",
              "debateSectionId": "dbsect_21",
              "parentDebateSection": null,
              "debateType": "financialResolution",
              "containsDebate": false,
              "bill": null,
              "counts": {
                "speechCount": 0,
                "speakerCount": 0
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_21",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          },
          {
            "debateSection": {
              "speakers": [],
              "showAs": "Financial Resolution No. 5: General (Resumed)",
              "debateSectionId": "dbsect_22",
              "parentDebateSection": null,
              "debateType": "financialResolution",
              "containsDebate": true,
              "bill": null,
              "counts": {
                "speechCount": 1,
                "speakerCount": 1
              },
              "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/dbsect_22",
              "formats": {
                "xml": null,
                "pdf": null
              }
            }
          }
        ],
        "chamber": {
          "showAs": "Dáil Éireann",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
        },
        "lastUpdated": "2025-10-15T22:22:22+01:00",
        "house": {
          "chamberType": "house",
          "showAs": "34th Dáil",
          "houseNo": "34",
          "houseCode": "dail",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/34",
          "committeeCode": ""
        },
        "date": "2025-10-15",
        "debateType": "debate",
        "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/main",
        "counts": {
          "debateSectionCount": 17,
          "questionCount": 0,
          "billCount": 0,
          "divisionCount": 1,
          "contributorCount": 164
        },
        "formats": {
          "writtens_pdf": null,
          "xml": {
            "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/mul@/main.xml"
          },
          "pdf": null
        }
      },
      "contextDate": "2025-10-15"
    }
  ]
}

houses
API:https://api.oireachtas.ie/v1/houses
Parameters
chamber_id - house.uri
chamber - house.houseCode values can be dail or seanad
skip - this will ignore the first x number of records set in the parameter
limit - this will only return a specific amount of records
Example
{
  "head": {
    "counts": {
      "housesCount": 68,
      "resultCount": 68
    }
  },
  "results": [
    {
      "house": {
        "houseType": "dail & seanad",
        "chamberCode": "dail & seanad",
        "seats": 234,
        "dateRange": {
          "start": "2025-01-29",
          "end": null
        },
        "chamberType": "house",
        "houseCode": "dail & seanad",
        "showAs": "34th Dáil & 27th Seanad",
        "houseNo": "27",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail & seanad/27"
      }
    }
  ]
}

Members
API: https://api.oireachtas.ie/v1/members
parameters
date_start (Greater Than or Equal To) - member.memberships.membership.dateRange.start
date_end (Less Than or Equal To) - member.memberships.membership.dateRange.start
chamber_id - member.memberships.membership.house.uri
chamber - member.memberships.membership.house.houseCode values can be dail or seanad
house_no - member.memberships.membership.house.houseNo
member_id - member.uri
skip - this will ignore the first x number of records set in the parameter
limit - this will only return a specific amount of records
party_code - member.memberships.membership.parties.party.partyCode
party_id - member.memberships.membership.parties.party.uri
const_code - member.memberships.membership.represents.represent.representCode
const_id - member.memberships.membership.represents.represent.uri
fuzzy_name_search - member.fullName
Example
{
  "head": {
    "counts": {
      "memberCount": 1927,
      "resultCount": 1927
    }
  },
  "results": [
    {
      "member": {
        "gender": "",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Henry-J-J-Abbott.D.1987-03-10",
        "pId": "HenryJJAbbott",
        "firstName": "Henry J. J.",
        "lastName": "Abbott",
        "image": false,
        "wikiTitle": null,
        "memberships": [
          {
            "membership": {
              "house": {
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/25",
                "houseCode": "dail",
                "houseNo": "25",
                "chamberType": "house",
                "showAs": "25th Dáil"
              },
              "represents": [
                {
                  "represent": {
                    "representCode": "Longford-Westmeath",
                    "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/25/constituency/Longford-Westmeath",
                    "representType": "constituency",
                    "showAs": "Longford-Westmeath"
                  }
                }
              ],
              "uri": "https://data.oireachtas.ie/ie/oireachtas/member/id/Henry-J-J-Abbott.D.1987-03-10/house/dail/25",
              "dateRange": {
                "end": "1989-05-25",
                "start": "1987-03-10"
              },
              "committees": [],
              "parties": [
                {
                  "party": {
                    "partyCode": "Fianna_Fáil",
                    "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/25/Fianna_Fáil",
                    "dateRange": {
                      "end": "1989-05-25",
                      "start": "1987-02-17"
                    },
                    "showAs": "Fianna Fáil"
                  }
                }
              ],
              "offices": []
            }
          }
        ],
        "dateOfDeath": null,
        "fullName": "Henry J. J. Abbott",
        "memberCode": "Henry-J-J-Abbott.D.1987-03-10",
        "showAs": "Henry J. J. Abbott"
      }
    }
  ]
}

Parties
API: https://api.oireachtas.ie/v1/parties
parameters
chamber_id - house.uri
chamber - house.houseCode values are dail or seanad
house_no - house.houseNo
skip - this will ignore the first x number of records set in the parameter
limit - this will only return a specific amount of records
Example
{
  "head": {
    "counts": {
      "partyCount": 11,
      "resultCount": 11
    }
  },
  "results": [
    {
      "party": {
        "partyCode": "Anti-Austerity_Alliance_People_Before_Profit",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Anti-Austerity_Alliance_People_Before_Profit",
        "showAs": "Anti-Austerity Alliance - People Before Profit"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Sinn_Féin",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Sinn_Féin",
        "showAs": "Sinn Féin"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Fianna_Fáil",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Fianna_Fáil",
        "showAs": "Fianna Fáil"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Renua",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Renua",
        "showAs": "Renua"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Socialist_Party",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Socialist_Party",
        "showAs": "Socialist Party"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Fine_Gael",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Fine_Gael",
        "showAs": "Fine Gael"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Social_Democrats",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Social_Democrats",
        "showAs": "Social Democrats"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "People_Before_Profit_Alliance",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/People_Before_Profit_Alliance",
        "showAs": "People Before Profit Alliance"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Labour_Party",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Labour_Party",
        "showAs": "Labour Party"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Independent",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Independent",
        "showAs": "Independent"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    },
    {
      "party": {
        "partyCode": "Workers_and_Unemployed_Action",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/party/dail/31/Workers_and_Unemployed_Action",
        "showAs": "Workers and Unemployed Action"
      },
      "house": {
        "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/31",
        "showAs": "31st Dáil",
        "houseCode": "dail",
        "houseNo": "31"
      }
    }
  ]
}

Legislation
API: https://api.oireachtas.ie/v1/legislation?
Parameters
bill_status - bill.status Values can be "Current, Withdrawn, Enacted, Rejected, Defeated, Lapsed"
bill_source - bill.source
date_start (Greater Than or Equal To) - bill.mostRecentStage.event.dates.date
date_end (Less Than or Equal To) - bill.mostRecentStage.event.dates.date
last_updated (Greater Than or Equal To) - bill.lastUpdated
skip - this will ignore the first x number of records set in the parameter
limit - this will only return a specific amount of records
member_id - bill.sponsors.sponsor.by.uri
bill_id - bill.uri
bill_no - bill.billNo
bill_year - bill.billYear
chamber_id - bill.mostRecentStage.event.house.uri
act_year - bill.act.actYear
act_no - bill.act.actNo
Example
{
  "head": {
    "counts": {
      "billCount": 4420,
      "resultCount": 4420
    }
  },
  "results": [
    {
      "bill": {
        "act": {
          "actNo": "3",
          "actYear": "2025",
          "dateSigned": "2025-04-15",
          "longTitleEn": "<p>Act to amend the Financial Services and Pensions Ombudsman Act 2017; to make provision regarding the calculation of expenses incurred by the Ombudsman in the performance of his or her functions; to provide for the appointment of additional persons to act as Ombudsman; to make further provision for the conduct of investigations; to provide for certain other consequential amendments; and to provide for related matters.</p>\n",
          "longTitleGa": "<p>Acht do leasú Acht an Ombudsman Seirbhísí Airgeadais agus Pinsean, 2017; do dhéanamh socrú maidir le caiteachais arna dtabhú ag an Ombudsman i gcomhlíonadh a fheidhmeanna nó a feidhmeanna a ríomh; do dhéanamh socrú maidir le daoine breise a cheapadh chun gníomhú mar Ombudsman; do dhéanamh socrú breise maidir le himscrúduithe a sheoladh; do dhéanamh socrú maidir le leasuithe iarmhartacha áirithe eile; agus do dhéanamh socrú i dtaobh nithe gaolmhara.</p>\n",
          "shortTitleEn": "Financial Services and Pensions Ombudsman (Amendment) Act 2025",
          "shortTitleGa": "Acht an Ombudsman Seirbhísí Airgeadais agus Pinsean (Leasú), 2025",
          "statutebookURI": "http://www.irishstatutebook.ie/eli/2025/act/3",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/act/2025/3"
        },
        "amendmentLists": [
          {
            "amendmentList": {
              "amendmentTypeUri": {
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/amendment-type/numberedList"
              },
              "chamber": {
                "showAs": "Seanad",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/seanad"
              },
              "date": "2025-04-01",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/seanad/3/amendment/numberedList/eng/b97a23d-scnl.pdf"
                },
                "xml": null
              },
              "showAs": "Numbered List [Seanad]",
              "stage": {
                "showAs": "Committee Stage",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/seanad/3"
              },
              "stageNo": "3"
            }
          },
          {
            "amendmentList": {
              "amendmentTypeUri": {
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/amendment-type/numberedList"
              },
              "chamber": {
                "showAs": "Dail",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/dail"
              },
              "date": "2025-03-04",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/dail/3/amendment/numberedList/eng/b9723d-dcnl.pdf"
                },
                "xml": null
              },
              "showAs": "Numbered List [Dáil]",
              "stage": {
                "showAs": "Committee Stage",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/dail/3"
              },
              "stageNo": "3"
            }
          }
        ],
        "billNo": "97",
        "billType": "Public",
        "billTypeURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-type/public",
        "billYear": "2023",
        "debates": [
          {
            "chamber": {
              "showAs": "Seanad Éireann",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/seanad"
            },
            "date": "2025-04-10",
            "debateSectionId": "dbsect_9",
            "showAs": "Financial Services and Pensions Ombudsman (Amendment) Bill 2023: Report and Final Stages",
            "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/seanad/2025-04-10/debate/main"
          },
          {
            "chamber": {
              "showAs": "Seanad Éireann",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/seanad"
            },
            "date": "2025-04-01",
            "debateSectionId": "dbsect_11",
            "showAs": "Financial Services and Pensions Ombudsman (Amendment) Bill 2023: Committee Stage",
            "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/seanad/2025-04-01/debate/main"
          },
          {
            "chamber": {
              "showAs": "Seanad Éireann",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/seanad"
            },
            "date": "2025-03-26",
            "debateSectionId": "dbsect_8",
            "showAs": "Financial Services and Pensions Ombudsman (Amendment) Bill 2023: Second Stage",
            "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/seanad/2025-03-26/debate/main"
          },
          {
            "chamber": {
              "showAs": "Dáil Éireann",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
            },
            "date": "2025-03-05",
            "debateSectionId": "dbsect_13",
            "showAs": "Financial Services and Pensions Ombudsman (Amendment) Bill 2023: Committee and Remaining Stages",
            "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-03-05/debate/main"
          },
          {
            "chamber": {
              "showAs": "Dáil Éireann",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
            },
            "date": "2024-02-08",
            "debateSectionId": "dbsect_30",
            "showAs": "Financial Services and Pensions Ombudsman (Amendment) Bill 2023: Second Stage",
            "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2024-02-08/debate/main"
          },
          {
            "chamber": {
              "showAs": "Dáil Éireann",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
            },
            "date": "2024-02-08",
            "debateSectionId": "dbsect_31",
            "showAs": "Financial Services and Pensions Ombudsman (Amendment) Bill 2023: Referral to Select Committee",
            "uri": "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2024-02-08/debate/main"
          }
        ],
        "events": [
          {
            "event": {
              "chamber": {
                "chamberCode": "dail",
                "showAs": "Dáil Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
              },
              "dates": [
                {
                  "date": "2023-12-19"
                },
                {
                  "date": "2025-02-05"
                },
                {
                  "date": "2025-04-15"
                }
              ],
              "eventURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-event/published",
              "showAs": "Published",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/published"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "dail",
                "showAs": "Dáil Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
              },
              "dates": [
                {
                  "date": "2024-11-08"
                }
              ],
              "eventURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-event/bill-lapsed",
              "showAs": "Bill Lapsed",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/bill-lapsed"
            }
          },
          {
            "event": {
              "chamber": null,
              "dates": [
                {
                  "date": "2025-04-15"
                }
              ],
              "eventURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-event/enacted",
              "showAs": "Enacted",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/enacted"
            }
          }
        ],
        "lastUpdated": "2025-04-24T15:49:43.440000+00:00",
        "longTitleEn": "<p>Bill entitled an Act to amend the Financial Services and Pensions Ombudsman Act 2017; to make provision regarding the calculation of expenses incurred by the Ombudsman in the performance of his or her functions; to provide for the appointment of additional persons to act as Ombudsman; to make further provision for the conduct of investigations; to provide for certain other consequential amendments; and to provide for related matters.</p>\n",
        "longTitleGa": "<p>Bille dá ngairtear Acht do leasú Acht an Ombudsman Seirbhísí Airgeadais agus Pinsean, 2017; do dhéanamh socrú maidir le caiteachais arna dtabhú ag an Ombudsman i gcomhlíonadh a fheidhmeanna nó a feidhmeanna a ríomh; do dhéanamh socrú maidir le daoine breise a cheapadh chun gníomhú mar Ombudsman; do dhéanamh socrú breise maidir le himscrúduithe a sheoladh; do dhéanamh socrú maidir le leasuithe iarmhartacha áirithe eile; agus do dhéanamh socrú i dtaobh nithe gaolmhara.</p>\n",
        "method": "Presented",
        "methodURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-method/presented",
        "mostRecentStage": {
          "event": {
            "chamber": null,
            "dates": [
              {
                "date": "2025-04-15"
              }
            ],
            "house": null,
            "progressStage": 10,
            "showAs": "Enacted",
            "stageCompleted": true,
            "stageOutcome": "Enacted",
            "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/enacted",
            "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/oireachtas/enacted"
          }
        },
        "originHouse": {
          "showAs": "Dáil Éireann",
          "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
        },
        "originHouseURI": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail",
        "relatedDocs": [
          {
            "relatedDoc": {
              "date": "2024-04-23",
              "docType": "digest",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/digest/lrsdigestfspoamt.pdf"
                },
                "xml": null
              },
              "lang": "eng",
              "showAs": "Bill Digest",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/digest"
            }
          },
          {
            "relatedDoc": {
              "date": "2024-02-08",
              "docType": "gluais",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/mul/gluais/gluais-02-2024-bille-an-ombudsman-seirbhisi-airgeadais-agus-pinsean-leasu-2023.pdf"
                },
                "xml": null
              },
              "lang": "mul",
              "showAs": "Glossary/Gluais",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/mul/gluais"
            }
          },
          {
            "relatedDoc": {
              "date": "2023-12-19",
              "docType": "memo",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/memo/b9723d-memo.pdf"
                },
                "xml": null
              },
              "lang": "eng",
              "showAs": "Explanatory Memorandum",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/memo"
            }
          }
        ],
        "shortTitleEn": "Financial Services and Pensions Ombudsman (Amendment) Bill 2023",
        "shortTitleGa": "Bille an Ombudsman Seirbhísí Airgeadais agus Pinsean (Leasú), 2023",
        "source": "Government",
        "sourceURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-source/government",
        "sponsors": [
          {
            "sponsor": {
              "as": {
                "showAs": "Minister for Finance",
                "uri": null
              },
              "by": {
                "showAs": null,
                "uri": null
              },
              "isPrimary": true
            }
          }
        ],
        "stages": [
          {
            "event": {
              "chamber": {
                "chamberCode": "dail",
                "showAs": "Dáil Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
              },
              "dates": [
                {
                  "date": "2023-12-19"
                },
                {
                  "date": "2023-12-19"
                }
              ],
              "house": {
                "chamberCode": "dail",
                "chamberType": "house",
                "houseCode": "dail",
                "houseNo": "33",
                "showAs": "33rd Dáil",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/33"
              },
              "progressStage": 1,
              "showAs": "First Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/1",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/dail/1"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "dail",
                "showAs": "Dáil Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
              },
              "dates": [
                {
                  "date": "2023-12-19"
                }
              ],
              "house": {
                "chamberCode": "dail",
                "chamberType": "house",
                "houseCode": "dail",
                "houseNo": "33",
                "showAs": "33rd Dáil",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/33"
              },
              "progressStage": 2,
              "showAs": "Second Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/2",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/dail/2"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "dail",
                "showAs": "Dáil Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
              },
              "dates": [
                {
                  "date": "2025-03-05"
                },
                {
                  "date": "2025-03-05"
                },
                {
                  "date": "2025-03-05"
                }
              ],
              "house": {
                "chamberCode": "dail",
                "chamberType": "house",
                "houseCode": "dail",
                "houseNo": "34",
                "showAs": "34th Dáil",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/34"
              },
              "progressStage": 3,
              "showAs": "Committee Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/3",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/dail/3"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "dail",
                "showAs": "Dáil Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
              },
              "dates": [
                {
                  "date": "2025-03-05"
                }
              ],
              "house": {
                "chamberCode": "dail",
                "chamberType": "house",
                "houseCode": "dail",
                "houseNo": "34",
                "showAs": "34th Dáil",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/34"
              },
              "progressStage": 4,
              "showAs": "Report Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/4",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/dail/4"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "dail",
                "showAs": "Dáil Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/dail"
              },
              "dates": [
                {
                  "date": "2025-03-05"
                }
              ],
              "house": {
                "chamberCode": "dail",
                "chamberType": "house",
                "houseCode": "dail",
                "houseNo": "34",
                "showAs": "34th Dáil",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/dail/34"
              },
              "progressStage": 5,
              "showAs": "Fifth Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/5",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/dail/5"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "seanad",
                "showAs": "Seanad Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/seanad"
              },
              "dates": [
                {
                  "date": "2025-03-26"
                }
              ],
              "house": {
                "chamberCode": "seanad",
                "chamberType": "house",
                "houseCode": "seanad",
                "houseNo": "27",
                "showAs": "27th Seanad",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/seanad/27"
              },
              "progressStage": 6,
              "showAs": "Second Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/2",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/seanad/2"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "seanad",
                "showAs": "Seanad Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/seanad"
              },
              "dates": [
                {
                  "date": "2025-04-01"
                }
              ],
              "house": {
                "chamberCode": "seanad",
                "chamberType": "house",
                "houseCode": "seanad",
                "houseNo": "27",
                "showAs": "27th Seanad",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/seanad/27"
              },
              "progressStage": 7,
              "showAs": "Committee Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/3",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/seanad/3"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "seanad",
                "showAs": "Seanad Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/seanad"
              },
              "dates": [
                {
                  "date": "2025-04-01"
                }
              ],
              "house": {
                "chamberCode": "seanad",
                "chamberType": "house",
                "houseCode": "seanad",
                "houseNo": "27",
                "showAs": "27th Seanad",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/seanad/27"
              },
              "progressStage": 8,
              "showAs": "Report Stage",
              "stageCompleted": false,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/4",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/seanad/4"
            }
          },
          {
            "event": {
              "chamber": {
                "chamberCode": "seanad",
                "showAs": "Seanad Éireann",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/def/house/seanad"
              },
              "dates": [
                {
                  "date": "2025-04-10"
                }
              ],
              "house": {
                "chamberCode": "seanad",
                "chamberType": "house",
                "houseCode": "seanad",
                "houseNo": "27",
                "showAs": "27th Seanad",
                "uri": "https://data.oireachtas.ie/ie/oireachtas/house/seanad/27"
              },
              "progressStage": 9,
              "showAs": "Fifth Stage",
              "stageCompleted": true,
              "stageOutcome": null,
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/5",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/seanad/5"
            }
          },
          {
            "event": {
              "chamber": null,
              "dates": [
                {
                  "date": "2025-04-15"
                }
              ],
              "house": null,
              "progressStage": 10,
              "showAs": "Enacted",
              "stageCompleted": true,
              "stageOutcome": "Enacted",
              "stageURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-stage/enacted",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/stage/oireachtas/enacted"
            }
          }
        ],
        "status": "Enacted",
        "statusURI": "https://data.oireachtas.ie/ie/oireachtas/def/bill-status/enacted",
        "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97",
        "versions": [
          {
            "version": {
              "date": "2025-04-15",
              "docType": "act",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/act/2025/3/gle/enacted/a0325i.pdf"
                },
                "xml": null
              },
              "lang": "gle",
              "showAs": "Acht an Ombudsman Seirbhísí Airgeadais agus Pinsean (Leasú), 2025",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/act/2025/3/gle/enacted"
            }
          },
          {
            "version": {
              "date": "2025-04-15",
              "docType": "act",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/act/2025/3/eng/enacted/a0325.pdf"
                },
                "xml": null
              },
              "lang": "eng",
              "showAs": "Financial Services and Pensions Ombudsman (Amendment) Act 2025",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/act/2025/3/eng/enacted"
            }
          },
          {
            "version": {
              "date": "2025-03-05",
              "docType": "bill",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/ver_a/b97a23d.pdf"
                },
                "xml": null
              },
              "lang": "eng",
              "showAs": "As passed by Dáil Éireann",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/ver_a"
            }
          },
          {
            "version": {
              "date": "2023-12-19",
              "docType": "bill",
              "formats": {
                "pdf": {
                  "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/initiated/b9723d.pdf"
                },
                "xml": null
              },
              "lang": "eng",
              "showAs": "As Initiated",
              "uri": "https://data.oireachtas.ie/ie/oireachtas/bill/2023/97/eng/initiated"
            }
          }
        ]
      },
      "billSort": {
        "actNoSort": 3,
        "actShortTitleEnSort": "financial-services-and-pensions-ombudsman-amendment-act-2025",
        "actShortTitleGaSort": "acht-an-ombudsman-seirbhisi-airgeadais-agus-pinsean-leasu-2025",
        "actYearSort": 2025,
        "billNoSort": 97,
        "billShortTitleEnSort": "financial-services-and-pensions-ombudsman-amendment-bill-2023",
        "billShortTitleGaSort": "bille-an-ombudsman-seirbhisi-airgeadais-agus-pinsean-leasu-2023",
        "billYearSort": 2023
      },
      "contextDate": "2025-04-15"
    }
  ]
}
