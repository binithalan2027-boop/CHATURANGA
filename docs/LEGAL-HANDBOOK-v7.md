# Chaturanga: US and India launch handbook
13 October 2026. Research and implementation checklist, not legal advice or clearance.

## Decision in one paragraph
The local demo can be submitted as a tested development build. It cannot honestly be called production-ready. Public account play is blocked pending actual hosting/OAuth, operator identity, audience and child-data route, retention/deletion operations, security/load testing, rights clearance and a staffed grievance process. No disclaimer makes copied assets lawful or replaces children's safeguards. A paid licence/subscription without stakes or winnings is different from money gaming, but monetisation must be reviewed before it is built. No payment or trial system was added.

## Recommended order
| Order | Before public launch | Current state |
|---|---|---|
| 1 | Operator's legal name, business contact, audience/countries and monitored email | Email normalized from owner's dictation as vinz97512@gmail.com; confirm spelling and monitoring. No phone number published. Other fields unresolved. |
| 2 | Child-data classification and safeguards, privacy/terms/consent wording | Local test age checkbox removed; no child-consent flow. Public auth has a separate review gate. |
| 3 | Rights audit and corresponding-source release | Fonts licensed and bundled; engine licences present; inherited assets and celebrity bot labels unresolved. |
| 4 | Hosting, OAuth, HTTPS/WSS, backups, security/load/abuse tests | One local Node + SQLite service. No deployed system or real OAuth round trip tested. |
| 5 | Staffed moderation/grievance/appeals, retention enforcement | Persistent private tickets and a local reviewer command built; no staffed response or automated SLA guaranteed. |

## What the code actually collects
The game database stores account ID, username/display name, optional bio/country/FIDE, timezone, discovery preference, profile readiness, legacy adult-confirmation field, friendships/blocks, games/results/clocks, provisional standard-chess app rating, report descriptions/targets/status/timestamps and local development sessions. It does not copy email/password/OAuth bearer tokens into the profile database. Supabase Auth, when configured, handles identity information; its real settings and deletion procedure must be reviewed. The server processes bearer tokens; hosting/reverse proxy can process IP/log metadata.

Browser storage holds preferences and local training/boards; tab session storage holds a local development token. The shipped legacy Learn page can request YouTube thumbnails/embeds and disclose IP/browser data to Google. The new design fonts are self-hosted, removing Google Fonts requests. An inherited component/asset inventory still needs review. Do not describe the entire application as third-party-tracking-free.

Profile deletion removes social connections, anonymizes opponent game records, terminates custom games and redacts the reporter's ticket details. It does not delete OAuth/Supabase identities or purge backups. Games may still be identifiable by context. Retention cleanup is not implemented. Export returns the user's profile, social connections, games, custom views and report statuses; a reviewer-assisted report-details export may still be needed. Expired local sessions are invalidated but not automatically purged from storage.

## US children's privacy: COPPA
The FTC rule covers commercial child-directed services collecting personal information and general-audience services with actual knowledge of under-13 collection. A chess/maths app is not automatically child-directed, nor automatically general-audience. Intended users, marketing, content and actual knowledge matter. COPPA does not impose a universal 18+ gate. Neutral age screening can be part of an appropriate route, but a checkbox or maths problem is not parental consent.

The FTC FAQ distinguishes general audience from mixed audience, which is a subset of child-directed. It specifically warns that mixed-audience services must not collect children's personal information before the proper route, and cannot simply use age screening to exclude children from all participation. Obtain expert classification before selecting a design. Local no-account practice may provide an alternative, but hosting and embedded third parties can still process identifiers.

Covered services need accurate notices, direct parental notice, verifiable parental consent where required, parental review/deletion, data minimisation, retention limits and security. The 2025 amended rule's main compliance date was 22 April 2026, already past. It adds stronger disclosure-consent, written security and retention requirements. Read the current rule for exact exceptions; do not treat Google/Facebook login as parental verification.

Sources:
- https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm
- https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

## US state privacy and consumer rules
California's CalOPPA is separate from CCPA and can require a conspicuous privacy policy for a commercial service collecting California residents' personal information, even when CCPA thresholds are not met. Include collection/sharing categories, change process, effective date and actual Do Not Track response. The current build has no behavioural-advertising feature; do not promise a DNT implementation that is absent.

CCPA coverage is conditional on business definition and thresholds, not automatic just because US users exist. California's Attorney General summary lists revenue, volume and sale/share-revenue tests. Verify the inflation-adjusted threshold against current regulations rather than copying the FAQ's historical $25m number. Where covered, implement applicable access/deletion/correction/opt-out and sensitive-data rights, with children's sale/sharing opt-in rules. No sale/share for behavioural ads is built here.

Other state privacy, children's design, consumer/refund, breach and accessibility laws depend on audience, scale and practices. This handbook is not a 50-state clearance. Avoid claiming universal compliance. Do not add cash stakes or prize competitions without separate state/federal gaming and tax review.

Sources:
- https://oag.ca.gov/privacy/ccpa
- https://www.oag.ca.gov/sites/all/files/agweb/pdfs/cybersecurity/making_your_privacy_practices_public.pdf

## India: DPDP is phased, not all effective today
The official G.S.R. 843(E) commencement notification puts sections 3-5, most section 6 provisions, sections 7-17 (including children's section 9) and other listed provisions in the eighteen-month group from Gazette publication. Do not say section 9's obligations are already fully in force on 13 October 2026. Preparation is still necessary and other existing law applies.

DPDP defines a child as under 18. When applicable, section 9 requires verifiable parent/lawful-guardian consent before processing, prohibits processing detrimental to well-being, and prohibits tracking/behavioural monitoring or targeted advertising to children, subject to statutory/notified exceptions. This chess app cannot assume an education exemption or a startup exemption.

Design consent notices around actual purposes, optional fields and equally easy withdrawal. Plan access/correction/erasure/grievance rights and processor deletion. Avoid collecting full DOB or ID documents casually. The final DPDP Rules were located through a Gazette index, but the official rules PDF could not be fetched because of a TLS/crawl failure in this research run. Consequently, precise final rule mechanics and exemptions remain a lawyer/source-verification gate, not a completed check. The official commencement notification and Act were inspected. A January 2026 MeitY PDF titled like the rules actually contains consultation feedback; it was not used as final law.

Sources:
- https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf
- https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023-1.pdf
- https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190655
- Final-rules lead only, not verified operative text: https://gazettetracker.com/g/CG-DL-E-14112025-267650
- Official final-rules PDF located but unavailable in this check: https://egazette.gov.in/WriteReadData/2025/267650.pdf

## India: Online Gaming Act and final 2026 Rules
The Promotion and Regulation of Online Gaming Rules 2026 took effect on 1 May 2026. The actual gazette was downloaded and read, not the 2025 draft.

The Act distinguishes online money games from social games and esports. Ordinary subscription or one-time access fees must not be conflated with staking money for expected winnings. Adding prizes, entry stakes, cash conversion or marketplace rewards changes the assessment. None is built.

Final rule 8 does not require every social game to be determined automatically: it names Authority directions, intended esports and government-notified social-game categories. Rule 12 likewise ties registration to notified games/categories and intended esports. Do not claim Chaturanga is approved/registered or that all chess apps automatically must register. Current notifications/Authority directions still need an operator-specific launch check.

Rule 2 lists risk-based user-safety features including age verification/gating, time limits, parental controls, reporting/grievances, counselling and integrity tools. It is not evidence that every social game must be 18+; it is also not permission to remove every safety control. Rules 16-19 incorporate directions on contact, data retention and payment verification. Rule 20 requires a functional grievance mechanism and provides a route to the Authority. A decorative email and unattended ticket queue are not a functional public operation.

Sources:
- https://www.meity.gov.in/static/uploads/2025/10/8a7f103cefc68ed8aaa2ebc9a2ed7c13.pdf
- https://www.meity.gov.in/static/uploads/2026/04/7e0b02d37fd07f81fa48578a9996aa85.pdf
- https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/apr/doc2026430859401.pdf

## India: intermediary duties and incident handling
Classify the service's user-generated profiles/reporting and intermediary role with counsel. The official IT Rules consolidated as amended 10 February 2026 were downloaded and read. Rule 3(2) states 24-hour grievance acknowledgement and seven-day general resolution, with specific faster routes; the specified intimate-image/sexual-content/impersonation complaint route has a two-hour requirement. Orders and other complaints have distinct timelines. Do not reuse older blanket fifteen-day resolution or twenty-four-hour intimate-image notes.

CERT-In's 28 April 2022 directions include six-hour reporting for specified incidents and 180-day ICT log retention within Indian jurisdiction for covered entities. These are not a requirement to retain every game/profile forever. Build an incident contact, severity rubric, emergency escalation, appropriate evidence/log retention and lawful disclosure procedure. Applicability and conflicts with minimisation/deletion need review.

Sources:
- https://www.meity.gov.in/static/uploads/2026/02/550681ab908f8afb135b0ad42816a1c9.pdf
- https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf

## Moderation operating handbook
Built: authenticated report form; six categories; bounded description; ten reports/day/user; persistent ticket; reporter-only status; account blocks; a local reviewer CLI with acknowledged/reviewing/resolved/rejected decisions. No automated banning, public chat or media upload.

Before opening to users:
1. Appoint a named reviewer and deputy and confirm the contact inbox. Review access must be limited to trusted host operators. Never publish the database or list command output.
2. Prioritise urgent child-safety, threats, non-consensual intimate material and privacy incidents; preserve lawful evidence without asking users to upload abuse imagery. Contact appropriate authorities when legally required.
3. Acknowledge/report decisions within the applicable statutory clocks. The code does not send email, start SLA timers or staff a queue.
4. Permit appeal through the monitored email with ticket ID. Record reasons and changes; handle conflicts of interest. Designate lawful external grievance routes where required.
5. Approve minimal retention periods for tickets, abuse evidence, sessions, games, security logs and backups. Add scheduled deletion and legal-hold controls, with documented exceptions.

Local reviewer examples: `npx tsx scripts/moderate.ts list`; `npx tsx scripts/moderate.ts resolve TICKET acknowledged 'Review started'`. These access private data locally; do not expose as an HTTP admin endpoint. Copying a Gmail contact into the app does not verify its ownership or monitoring, and no email has been sent.

## Copyright, trademarks, names and credits
Game mechanics and rules are not the same as protected expression. The US Copyright Office says the idea, title and playing method are not protected by copyright, while literary/artistic game expression can be. Names may still be trademarks; source code, images, illustrations, text and database selections can have rights. India's official Copyright handbook likewise distinguishes ideas from expression and covers computer programs. Avoid copying competitor graphics, wording, logos or annotated game collections.

A disclaimer or credits line is not a licence. Search Chaturanga/Khivin and proposed domain names in US/Indian trademark registers and assess similarity/classes with counsel. No name clearance was completed here. Celebrity-named bots Magnus/Hikaru/Vishy remain inherited, with explicit unofficial labels. That is not permission to use name/likeness or imply endorsement. The owner previously chose to manage these names; they are documented launch blockers rather than silently renamed.

Sources:
- https://copyright.gov/register/tx-games.html
- https://copyright.gov.in/documents/handbook.html
- https://www.indiacode.nic.in/handle/123456789/1367?locale=en
- https://www.uspto.gov/trademarks/search/likelihood-confusion
- https://tmrsearch.ipindia.gov.in/tmrpublicsearch/ (search route only; no clearance)

## Licence and asset inventory
| Component | Licence/action |
|---|---|
| Stockfish 19 Lite, Fairy-Stockfish WASM | GPL notices and full texts present. Identify exact upstream sources/build recipes and provide corresponding source for distributed binaries. |
| chessops | GPL-3.0-or-later. Browser/source combination needs GPL-compatible distribution analysis. |
| chess.js | BSD-2-Clause: retain copyright/conditions/disclaimer. |
| React/Vite and runtime dependencies | Retain component notices; inspect exact package licences. |
| Noto Sans/Serif Devanagari | Unmodified self-hosted OFL 1.1 font files with full copyright/licence text. Do not sell fonts by themselves or relicense font files. |
| New courtyard palette/layout | Original styling; no new third-party photographs. |
| Platform chess glyphs | Rendered by device symbol font; no redistributed glyph font added. |
| Inherited SVG pieces, spell JPGs, old generated assets | Provenance unresolved. Audit or replace before distributing. |
| External YouTube material / historical game score | Check provider terms, creators' rights, factual-score provenance and database terms; do not scrape/copy commentary. |
| Celebrity labels, Chaturanga/Khivin mark | Name/likeness/trademark review unresolved. |

Stockfish/chessops GPL obligations cannot be met by merely displaying 'powered by Stockfish'. Browser downloads distribute software. Put licences/copyright and source/build access in About/Credits and the distributed package; do not claim a source link exists while the repository remains private. GPL is not a ban on charging: it does grant recipients redistribution/source rights, so commercial plans must respect that. GPL does not automatically force every unrelated hosting component public merely because it talks over a network; combined-work boundaries need analysis. See GNU's FAQ and exact licences.

Sources:
- https://www.gnu.org/licenses/gpl-faq.html
- https://github.com/lichess-org/chessops/blob/master/LICENSE
- https://github.com/jhlywa/chess.js/blob/master/LICENSE
- https://github.com/nmrugg/stockfish.js
- https://github.com/fairy-stockfish/fairy-stockfish.wasm
- https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifdevanagari/OFL.txt

## Displays to finish before launch
- Privacy and terms links on landing, login and collection forms; actual operator, monitored contact, dated version, data/purpose/sharing/retention, child route, DNT and embedded-service disclosure.
- Rules and house-rules label, unrated custom mode, honest app/FIDE/engine distinctions.
- Community/report/block/appeal links and required grievance personnel/details.
- Full open-source credits/licences and genuine corresponding-source/build access.
- Licence/price/trial/refund and purchase restoration disclosures only when payments are implemented.
- Age/content ratings and store data/deletion declarations from actual app behaviour, not a template.
- Registration/determination details only if actually obtained. No invented compliance badges.

## Unresolved questions for the owner and lawyer
Legal operator name/address; countries/audience; whether children will be supported; consent/age route; contact spelling and staffing; actual auth/hosting/video providers; retention/backup/deletion schedule; security contacts; rights to legacy assets/player names; GPL release packaging; payment and refund design. Public launch must resolve these. Other jurisdictions, litigation/constitutional changes and later Authority directions are outside the verified scope of this report and must be rechecked at launch.
