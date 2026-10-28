import { stockfishAnalyze } from "./stockfishAdapter";
import MistakePuzzleEngine from "./MistakePuzzleEngine";
import { useState, useEffect } from "react";
import PositionBoard from "./PositionBoard";
import { Chess, Square } from "chess.js";
import { parsePgn, fromFen, studyMove, materialEval, StudyLine } from "./study";
import AnalysisCoach from "./AnalysisCoach";
import OpeningExplorer from "./OpeningExplorer";
import { LIBRARY } from "./library";
import {
  fetchDailyPuzzle,
  fetchOpeningExplorer,
  LichessOpeningStats,
} from "../services/lichess";
import {
  fetchChessComProfile,
  fetchChessComArchives,
  fetchChessComMonthlyGames,
  validateGameForImport,
  ChessComPlayerProfile,
  ChessComArchiveMonth,
  ChessComArchiveGame,
} from "./chesscom";

export default function StudyBoard({ onExit }: { onExit: () => void }) {
  const [line, setLine] = useState<StudyLine>(() => parsePgn(""));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [flip, setFlip] = useState(false);
  const [engine, setEngine] = useState(false);
  const [evaluation, setEvaluation] = useState("Engine off");
  const [best, setBest] = useState("");
  const [activeTab, setActiveTab] = useState<
    "board" | "openings" | "library" | "chesscom" | "import"
  >("board");

  // Lichess Openings Explorer state
  const [lichessStats, setLichessStats] = useState<LichessOpeningStats | null>(null);
  const [loadingLichess, setLoadingLichess] = useState(false);

  // Chess.com Importer state
  const [chessComUser, setChessComUser] = useState("");
  const [chessComProfile, setChessComProfile] = useState<ChessComPlayerProfile | null>(null);
  const [chessComArchives, setChessComArchives] = useState<ChessComArchiveMonth[]>([]);
  const [selectedArchiveUrl, setSelectedArchiveUrl] = useState<string>("");
  const [chessComGames, setChessComGames] = useState<ChessComArchiveGame[]>([]);
  const [loadingChessCom, setLoadingChessCom] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [chessComError, setChessComError] = useState<string | null>(null);

  const fen = line.fens[index];
  const chess = new Chess(fen);
  const legal = selected
    ? chess.moves({ square: selected, verbose: true }).map((m) => m.to)
    : [];

  // Query Lichess opening statistics when opening tab or request is active
  useEffect(() => {
    let cancelled = false;
    if (activeTab === "openings" || lichessStats !== null) {
      setLoadingLichess(true);
      fetchOpeningExplorer(fen, "masters").then((stats) => {
        if (!cancelled) {
          setLichessStats(stats);
          setLoadingLichess(false);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [fen, activeTab]);

  useEffect(() => {
    setBest("");
    if (!engine) {
      setEvaluation("Engine off");
      return;
    }
    const ctl = new AbortController();
    setEvaluation("Starting Stockfish lite…");
    stockfishAnalyze(fen, {
      depth: 10,
      signal: ctl.signal,
      onInfo: (info) => {
        const sign = new Chess(fen).turn() === "w" ? 1 : -1;
        setEvaluation(
          info.mate !== undefined
            ? `Mate ${info.mate * sign}`
            : info.cp !== undefined
              ? `${((info.cp * sign) / 100).toFixed(2)} pawns · depth ${info.depth || "?"}`
              : "Analyzing…",
        );
      },
    })
      .then((result) => setBest(result.best))
      .catch(() => {
        if (!ctl.signal.aborted)
          setEvaluation(
            "Stockfish unavailable in this browser. Material balance is still shown.",
          );
      });
    return () => ctl.abort();
  }, [engine, fen]);

  const load = (kind: "pgn" | "fen") => {
    try {
      const next = kind === "pgn" ? parsePgn(text) : fromFen(text);
      setLine(next);
      setIndex(0);
      setSelected(null);
      setError("");
      setBest("");
      setActiveTab("board");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load this game.");
    }
  };

  const move = (sq: Square) => {
    if (selected && legal.includes(sq)) {
      try {
        let promotion = "q";
        if (chess.get(selected)?.type === "p" && ["1", "8"].includes(sq[1])) {
          const requested = window.prompt("Promote to q, r, b or n", "q");
          if (!requested) return;
          if (!["q", "r", "b", "n"].includes(requested)) {
            setError("Choose q, r, b or n.");
            return;
          }
          promotion = requested;
        }
        const next = studyMove(line, index, selected, sq, promotion);
        setLine(next);
        setIndex(index + 1);
        setSelected(null);
        setError("");
      } catch (e) {
        setError(String(e));
      }
      return;
    }
    setSelected(chess.get(sq)?.color === chess.turn() ? sq : null);
  };

  const exportPgn = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([line.pgn], { type: "application/x-chess-pgn" }),
    );
    a.download = "chaturanga-study.pgn";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Load Lichess Daily Tactical Puzzle
  const handleLoadDailyPuzzle = async () => {
    setLoadingLichess(true);
    const puzzle = await fetchDailyPuzzle();
    setLoadingLichess(false);
    if (puzzle && puzzle.game?.pgn) {
      try {
        const next = parsePgn(puzzle.game.pgn);
        setLine(next);
        setIndex(puzzle.initialPly || 0);
        setSelected(null);
        setActiveTab("board");
      } catch (e) {
        setError("Unable to parse Lichess daily puzzle.");
      }
    } else {
      setError("Unable to fetch Lichess daily puzzle at this time.");
    }
  };

  // Search Chess.com user profile and archives
  const handleSearchChessCom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chessComUser.trim() || loadingChessCom) return;
    setLoadingChessCom(true);
    setChessComError(null);
    setChessComProfile(null);
    setChessComArchives([]);
    setChessComGames([]);

    const profRes = await fetchChessComProfile(chessComUser);
    if (profRes.error) {
      setLoadingChessCom(false);
      setChessComError(profRes.error);
      return;
    }
    setChessComProfile(profRes.profile);

    const archRes = await fetchChessComArchives(chessComUser);
    setLoadingChessCom(false);

    const archives = archRes.archives || [];
    setChessComArchives(archives);

    if (archRes.error && archives.length === 0) {
      setChessComError(archRes.error);
      return;
    }

    if (archives.length > 0) {
      const firstArchive = archives[0].url;
      setSelectedArchiveUrl(firstArchive);
      void loadMonthlyGames(firstArchive);
    }
  };

  const loadMonthlyGames = async (archiveUrl: string) => {
    setLoadingGames(true);
    setChessComError(null);
    const res = await fetchChessComMonthlyGames(archiveUrl);
    setLoadingGames(false);
    if (res.error) {
      setChessComError(res.error);
    } else {
      setChessComGames(res.games || []);
    }
  };

  const handleSelectArchiveMonth = (archiveUrl: string) => {
    setSelectedArchiveUrl(archiveUrl);
    void loadMonthlyGames(archiveUrl);
  };

  const handleLoadChessComGame = (game: ChessComArchiveGame) => {
    setChessComError(null);
    const validation = validateGameForImport(game.pgn, game.rules);
    if (!validation.ok) {
      setChessComError(validation.error);
      return;
    }
    try {
      const next = parsePgn(game.pgn);
      setLine(next);
      setIndex(0);
      setSelected(null);
      setError("");
      setActiveTab("board");
    } catch (err) {
      setChessComError(err instanceof Error ? err.message : "Unable to parse game PGN.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <span className="matiks-kicker block mb-1">
              STUDY THE GAME · MASTER POSITIONAL INSIGHT
            </span>
            <h1 className="matiks-headline text-4xl lg:text-5xl text-[#F4F4F4] m-0">
              STUDY ROOM
            </h1>
            <p className="text-sm text-[#8A8A8A] mt-2 mb-0 max-w-xl">
              Explore opening lines with live Lichess databases, review classical games, import Chess.com player archives, and analyze positions with Stockfish & Gemini AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFlip(!flip)}
              className="btn-raised py-2.5 px-4 text-xs"
            >
              🔄 Flip Board
            </button>
            <button
              onClick={onExit}
              className="btn-raised py-2.5 px-4 text-xs"
            >
              ← Return to Hub
            </button>
          </div>
        </div>

        {/* 4 Bento Study Hub Cards matching 03-web-study.svg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Openings Bento (Lavender) with Lichess stats */}
          <div
            onClick={() => setActiveTab("openings")}
            className="bento-card bento-lavender p-6 cursor-pointer flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0E0E0E]/70 uppercase block mb-1">
                LICHESS MASTERS DATA
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#0E0E0E] m-0">
                OPENINGS
              </h3>
              <p className="text-xs font-body text-[#0E0E0E]/80 mt-2 mb-0">
                Explore opening lines, master win rates, and deep theory trees.
              </p>
            </div>
            <button className="mt-4 w-full py-2 px-3 rounded-full bg-[#0E0E0E] text-[#A594F0] text-xs font-semibold cursor-pointer border-none text-center">
              Explore Openings →
            </button>
          </div>

          {/* Endgames Bento (Teal) */}
          <div
            onClick={() => {
              setLine(fromFen("8/8/4k3/8/8/4K3/4P3/8 w - - 0 1"));
              setIndex(0);
              setActiveTab("board");
            }}
            className="bento-card bento-teal p-6 cursor-pointer flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0E0E0E]/70 uppercase block mb-1">
                TECHNIQUE
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#0E0E0E] m-0">
                ENDGAMES
              </h3>
              <p className="text-xs font-body text-[#0E0E0E]/80 mt-2 mb-0">
                Practise the final moves, king-and-pawn opposition, and conversions.
              </p>
            </div>
            <button className="mt-4 w-full py-2 px-3 rounded-full bg-[#0E0E0E] text-[#66D4C2] text-xs font-semibold cursor-pointer border-none text-center">
              Practice Endgames →
            </button>
          </div>

          {/* Daily Puzzle Bento (Yellow) with Lichess connection */}
          <div
            onClick={handleLoadDailyPuzzle}
            className="bento-card bento-yellow p-6 cursor-pointer flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0E0E0E]/70 uppercase block mb-1">
                LICHESS LIVE PUZZLE
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#0E0E0E] m-0">
                DAILY TACTIC
              </h3>
              <p className="text-xs font-body text-[#0E0E0E]/80 mt-2 mb-0">
                Load today&apos;s featured tactical challenge directly from Lichess.
              </p>
            </div>
            <button className="mt-4 w-full py-2 px-3 rounded-full bg-[#0E0E0E] text-[#F2D500] text-xs font-semibold cursor-pointer border-none text-center">
              {loadingLichess ? "Fetching..." : "Load Daily Puzzle →"}
            </button>
          </div>

          {/* Chess.com Import Bento (Charcoal) */}
          <div
            onClick={() => setActiveTab("chesscom")}
            className="bento-card bento-charcoal p-6 cursor-pointer flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <span className="matiks-kicker text-[10px] block mb-1">
                PUBLIC ARCHIVES
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#F4F4F4] m-0">
                CHESS.COM
              </h3>
              <p className="text-xs font-body text-[#8A8A8A] mt-2 mb-0">
                Import any public player profile or recent game archive for study.
              </p>
            </div>
            <button className="mt-4 w-full py-2 px-3 rounded-full bg-[#262626] hover:bg-[#333333] text-[#AFF65B] text-xs font-semibold cursor-pointer border border-white/5 text-center">
              Import Games →
            </button>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("board")}
            className={`py-2 px-4 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "board"
                ? "bg-[#AFF65B] text-[#0E0E0E]"
                : "bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F4F4F4]"
            }`}
          >
            Analysis Board
          </button>
          <button
            onClick={() => setActiveTab("openings")}
            className={`py-2 px-4 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "openings"
                ? "bg-[#AFF65B] text-[#0E0E0E]"
                : "bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F4F4F4]"
            }`}
          >
            Lichess Openings Explorer
          </button>
          <button
            onClick={() => setActiveTab("chesscom")}
            className={`py-2 px-4 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "chesscom"
                ? "bg-[#AFF65B] text-[#0E0E0E]"
                : "bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F4F4F4]"
            }`}
          >
            Chess.com Importer
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`py-2 px-4 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "library"
                ? "bg-[#AFF65B] text-[#0E0E0E]"
                : "bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F4F4F4]"
            }`}
          >
            Historic Classics
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`py-2 px-4 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "import"
                ? "bg-[#AFF65B] text-[#0E0E0E]"
                : "bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F4F4F4]"
            }`}
          >
            Import FEN / PGN
          </button>
        </div>

        {/* Interactive Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Board Column */}
          <section className="lg:col-span-7 flex flex-col items-center">
            
            {/* Board Status / Title */}
            <div className="w-full max-w-[640px] flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xl text-[#F4F4F4]">
                    {line.headers.White && line.headers.White !== "?"
                      ? `${line.headers.White} vs ${line.headers.Black}`
                      : "Interactive Analysis Board"}
                  </span>
                  {line.headers.Site?.includes("Chess.com") && (
                    <span className="text-[10px] font-mono text-[#AFF65B] px-2 py-0.5 rounded bg-[#AFF65B]/10 border border-[#AFF65B]/20">
                      Data: Chess.com PubAPI
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#8A8A8A] block">
                  {chess.isCheckmate()
                    ? "Checkmate"
                    : chess.isCheck()
                      ? "Check"
                      : `${chess.turn() === "w" ? "White" : "Black"} to move`}{" "}
                  · ply {index}/{line.sans.length}
                </span>
              </div>
              <span className="text-xs text-[#AFF65B] font-mono bg-[#1A1A1A] px-2.5 py-1 rounded-full border border-white/5">
                Bal: {materialEval(fen).toFixed(1)}
              </span>
            </div>

            {/* Position Board Component (Matiks Pieces) */}
            <div className="w-full max-w-[640px]">
              <PositionBoard
                fen={fen}
                selected={selected}
                legal={legal}
                onSquare={move}
                flip={flip}
              />
            </div>

            {/* Turn-by-Turn Replay Navigation Bar */}
            <div className="w-full max-w-[640px] grid grid-cols-4 gap-2 mt-4">
              <button
                disabled={index === 0}
                onClick={() => {
                  setIndex(0);
                  setSelected(null);
                }}
                className="btn-raised py-2.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ⏮ First
              </button>
              <button
                disabled={index === 0}
                onClick={() => {
                  setIndex(index - 1);
                  setSelected(null);
                }}
                className="btn-raised py-2.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ‹ Prev
              </button>
              <button
                disabled={index === line.sans.length}
                onClick={() => {
                  setIndex(index + 1);
                  setSelected(null);
                }}
                className="btn-raised py-2.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next ›
              </button>
              <button
                disabled={index === line.sans.length}
                onClick={() => {
                  setIndex(line.sans.length);
                  setSelected(null);
                }}
                className="btn-raised py-2.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Last ⏭
              </button>
            </div>
          </section>

          {/* Right Sidebar Panels */}
          <aside className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Gemini AI Coach & Stockfish Card */}
            <div className="bento-card bento-charcoal p-5">
              <span className="matiks-kicker text-[10px] block mb-2">
                GEMINI AI COACH & STOCKFISH
              </span>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F4F4F4]">
                  <input
                    type="checkbox"
                    checked={engine}
                    onChange={(e) => {
                      setEngine(e.target.checked);
                      setBest("");
                    }}
                    className="accent-[#AFF65B]"
                  />
                  <span>Local Stockfish Engine</span>
                </label>
                <span className="text-xs font-mono text-[#AFF65B]">
                  {evaluation}
                </span>
              </div>
              <AnalysisCoach
                fen={fen}
                previousFen={index ? line.fens[index - 1] : undefined}
                san={index ? line.sans[index - 1] : undefined}
                best={best}
                evaluation={evaluation}
              />
            </div>

            {/* Move List */}
            <div className="bento-card bento-charcoal p-5 max-h-[190px] flex flex-col">
              <span className="matiks-kicker text-[10px] block mb-2">
                GAME MOVES ({line.sans.length})
              </span>
              <div className="overflow-y-auto flex-1 flex flex-wrap gap-1 pr-1">
                {line.sans.length === 0 ? (
                  <span className="text-xs text-[#8A8A8A] italic">Empty board. Make a move on the board to start.</span>
                ) : (
                  line.sans.map((san, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setIndex(i + 1);
                        setSelected(null);
                      }}
                      className={`py-1 px-2 rounded text-xs font-mono cursor-pointer border-none transition-colors ${
                        index === i + 1
                          ? "bg-[#AFF65B] text-[#0E0E0E] font-bold"
                          : "bg-[#262626] text-[#F4F4F4] hover:bg-[#333333]"
                      }`}
                    >
                      {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ""}
                      {san}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Tab: Lichess Openings Explorer */}
            {activeTab === "openings" && (
              <div className="bento-card bento-charcoal p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="matiks-kicker text-[10px]">
                    LICHESS MASTERS DATABASE STATS
                  </span>
                  {loadingLichess && (
                    <span className="text-xs text-[#8A8A8A] italic">Loading…</span>
                  )}
                </div>

                {lichessStats ? (
                  <div className="space-y-3">
                    {lichessStats.opening && (
                      <div className="p-2.5 rounded-lg bg-[#262626] border border-white/5">
                        <strong className="text-xs text-[#AFF65B] font-mono block">
                          {lichessStats.opening.eco}
                        </strong>
                        <span className="text-xs text-[#F4F4F4]">
                          {lichessStats.opening.name}
                        </span>
                      </div>
                    )}

                    {/* Win percentage bar */}
                    {lichessStats.white + lichessStats.draws + lichessStats.black > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] text-[#8A8A8A] mb-1 font-mono">
                          <span>White {Math.round((lichessStats.white / (lichessStats.white + lichessStats.draws + lichessStats.black)) * 100)}%</span>
                          <span>Draw {Math.round((lichessStats.draws / (lichessStats.white + lichessStats.draws + lichessStats.black)) * 100)}%</span>
                          <span>Black {Math.round((lichessStats.black / (lichessStats.white + lichessStats.draws + lichessStats.black)) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden flex">
                          <div style={{ width: `${(lichessStats.white / (lichessStats.white + lichessStats.draws + lichessStats.black)) * 100}%` }} className="bg-[#FAFAFA]" />
                          <div style={{ width: `${(lichessStats.draws / (lichessStats.white + lichessStats.draws + lichessStats.black)) * 100}%` }} className="bg-[#8A8A8A]" />
                          <div style={{ width: `${(lichessStats.black / (lichessStats.white + lichessStats.draws + lichessStats.black)) * 100}%` }} className="bg-[#1B1B1B] border border-white/20" />
                        </div>
                      </div>
                    )}

                    {/* Top candidate moves from Lichess */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#8A8A8A] font-semibold uppercase tracking-wider block">
                        Master Continuations
                      </span>
                      {lichessStats.moves.slice(0, 5).map((m) => (
                        <div key={m.uci} className="flex items-center justify-between p-2 rounded bg-[#262626] text-xs">
                          <span className="font-bold text-[#AFF65B] font-mono">{m.san}</span>
                          <span className="text-[11px] text-[#8A8A8A] font-mono">
                            {(m.white + m.draws + m.black).toLocaleString()} games
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8A8A8A] m-0">
                    Querying Lichess open database for current position…
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-white/5">
                  <OpeningExplorer
                    line={line}
                    index={index}
                    onLoad={(next) => {
                      setLine(next);
                      setIndex(next.sans.length);
                      setSelected(null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tab: Chess.com Importer */}
            {activeTab === "chesscom" && (
              <div className="bento-card bento-charcoal p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="matiks-kicker text-[10px]">
                    IMPORT FROM CHESS.COM
                  </span>
                  <span className="text-[10px] text-[#AFF65B] font-mono px-2 py-0.5 rounded bg-[#AFF65B]/10 border border-[#AFF65B]/20">
                    Data: Chess.com PubAPI
                  </span>
                </div>

                <form onSubmit={handleSearchChessCom} className="flex gap-2">
                  <input
                    type="text"
                    value={chessComUser}
                    onChange={(e) => setChessComUser(e.target.value)}
                    disabled={loadingChessCom || loadingGames}
                    placeholder="Enter Chess.com username (e.g. hikaru)"
                    className="flex-1 p-2.5 rounded-lg bg-[#262626] border border-white/10 text-xs text-[#F4F4F4] focus:outline-none focus:border-[#AFF65B] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loadingChessCom || loadingGames || !chessComUser.trim()}
                    className="btn-lime py-2 px-4 text-xs font-bold whitespace-nowrap disabled:opacity-50"
                  >
                    {loadingChessCom ? "Searching…" : "Find Player →"}
                  </button>
                </form>

                {/* Error Banner */}
                {chessComError && (
                  <div className="p-3 rounded-xl bg-[#262626] border border-[#E5484D]/30 text-xs text-[#F2D500]">
                    {chessComError}
                  </div>
                )}

                {/* Player Profile Card */}
                {chessComProfile && (
                  <div className="p-3.5 rounded-xl bg-[#262626] border border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {chessComProfile.avatar ? (
                        <img
                          src={chessComProfile.avatar}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#1A1A1A] flex items-center justify-center font-heading text-lg text-[#AFF65B] border border-white/10">
                          {chessComProfile.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          {chessComProfile.title && (
                            <span className="px-1.5 py-0.5 rounded bg-[#E5484D] text-[#FAFAFA] font-bold text-[9px]">
                              {chessComProfile.title}
                            </span>
                          )}
                          <span className="font-heading text-base text-[#F4F4F4]">
                            {chessComProfile.name || chessComProfile.username}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#8A8A8A] block">
                          @{chessComProfile.username} · {chessComProfile.followers?.toLocaleString() || 0} followers
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Month Archive Picker */}
                {(chessComArchives?.length ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#8A8A8A] block">
                      Choose Monthly Archive ({chessComArchives.length} available)
                    </label>
                    <select
                      value={selectedArchiveUrl}
                      onChange={(e) => handleSelectArchiveMonth(e.target.value)}
                      disabled={loadingGames || loadingChessCom}
                      className="w-full p-2.5 rounded-lg bg-[#262626] border border-white/10 text-xs text-[#F4F4F4] focus:outline-none focus:border-[#AFF65B] cursor-pointer"
                    >
                      {chessComArchives.map((arch) => (
                        <option key={arch.url} value={arch.url} className="bg-[#1A1A1A]">
                          {arch.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {loadingGames && (
                  <div className="py-4 text-center">
                    <span className="text-xs text-[#8A8A8A] italic animate-pulse">
                      Loading games from Chess.com archive…
                    </span>
                  </div>
                )}

                {/* Games List for Selected Month */}
                {(chessComGames?.length ?? 0) > 0 && !loadingGames && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#8A8A8A]">
                      <span>{chessComGames.length} games in archive</span>
                      <span className="text-[10px]">Select a game to load</span>
                    </div>

                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                      {chessComGames.map((g, i) => {
                        const isNonStandard = g.rules && g.rules.toLowerCase() !== "chess";
                        const whiteWon = g.white.result === "win";
                        const blackWon = g.black.result === "win";

                        return (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-[#262626] hover:bg-[#2F2F2F] border border-white/5 flex items-center justify-between gap-3 text-xs transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`font-semibold ${whiteWon ? "text-[#AFF65B]" : "text-[#F4F4F4]"}`}>
                                  {g.white.username} ({g.white.rating || "?"})
                                </span>
                                <span className="text-[#8A8A8A]">vs</span>
                                <span className={`font-semibold ${blackWon ? "text-[#AFF65B]" : "text-[#F4F4F4]"}`}>
                                  {g.black.username} ({g.black.rating || "?"})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8A8A8A]">
                                <span className="capitalize">{g.time_class || "Chess"}</span>
                                <span>·</span>
                                <span>{new Date(g.end_time * 1000).toLocaleDateString()}</span>
                                {isNonStandard && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#F2D500]/20 text-[#F2D500] font-mono text-[9px]">
                                    {g.rules}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleLoadChessComGame(g)}
                              className="btn-lime py-1.5 px-3 text-[11px] font-bold whitespace-nowrap"
                            >
                              Load ↗
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Historic Master Games */}
            {activeTab === "library" && (
              <div className="bento-card bento-charcoal p-5">
                <span className="matiks-kicker text-[10px] block mb-2">
                  HISTORIC MASTER GAMES
                </span>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {LIBRARY.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setLine(parsePgn(g.pgn));
                        setIndex(0);
                        setSelected(null);
                        setError("");
                      }}
                      className="w-full text-left p-3 rounded-lg bg-[#262626] hover:bg-[#333333] border border-white/5 cursor-pointer"
                    >
                      <strong className="text-sm text-[#F4F4F4] block font-heading">{g.title}</strong>
                      <span className="text-xs text-[#8A8A8A] block">{g.event} · {g.result}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Import / Export */}
            {activeTab === "import" && (
              <div className="bento-card bento-charcoal p-5">
                <span className="matiks-kicker text-[10px] block mb-2">
                  IMPORT OR EXPORT POSITION
                </span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={1000000}
                  placeholder="Paste PGN notation or standard FEN string"
                  className="w-full h-24 p-2.5 rounded-lg bg-[#262626] border border-white/10 text-xs text-[#F4F4F4] font-mono mb-3 resize-none focus:outline-none focus:border-[#AFF65B]"
                />
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => load("pgn")} className="btn-lime py-2 px-3 text-xs">
                    Load PGN
                  </button>
                  <button onClick={() => load("fen")} className="btn-raised py-2 px-3 text-xs">
                    Load FEN
                  </button>
                  <button onClick={exportPgn} className="btn-raised py-2 px-3 text-xs">
                    Export PGN
                  </button>
                  <button
                    onClick={() => {
                      setLine(parsePgn(""));
                      setIndex(0);
                      setError("");
                    }}
                    className="btn-raised py-2 px-3 text-xs"
                  >
                    Reset Board
                  </button>
                </div>
                {error && <p className="text-xs text-[#E5484D] mt-2 mb-0">{error}</p>}
              </div>
            )}

            <MistakePuzzleEngine line={line} />
          </aside>
        </div>
      </div>
    </div>
  );
}
