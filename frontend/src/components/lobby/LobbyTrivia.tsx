"use client";

import React, { useState, useEffect, useRef } from "react";
import { TriviaQuestion, getRandomQuestions } from "@/lib/triviaQuestions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Zap, X, Award, CheckCircle2, XCircle } from "lucide-react";

export interface TriviaPlayerScore {
  userId: string;
  username: string;
  score: number;
}

interface LobbyTriviaProps {
  lobbyId: string;
  currentUserId: string;
  currentUsername: string;
  isActive: boolean;
  onClose: () => void;
  sendGameAction: (payload: unknown) => void;
  incomingGameEvent?: {
    sender_id: string;
    sender_username: string;
    data?: any;
  } | null;

  onAnnounceToChat?: (content: string) => void;
}

const QUESTION_DURATION = 15; // 15 seconds per question

export function LobbyTrivia({
  lobbyId,
  currentUserId,
  currentUsername,
  isActive,
  onClose,
  sendGameAction,
  incomingGameEvent,
  onAnnounceToChat,
}: LobbyTriviaProps) {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scores, setScores] = useState<Record<string, { username: string; score: number }>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [sessionLeader, setSessionLeader] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nextQuestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or start trivia session
  const startNewTrivia = () => {
    const qList = getRandomQuestions(5);
    setQuestions(qList);
    setCurrentQIndex(0);
    setTimeLeft(QUESTION_DURATION);
    setSelectedOption(null);
    setIsRevealed(false);
    setIsFinished(false);
    setScores({
      [currentUserId]: { username: currentUsername, score: 0 },
    });

    // Broadcast session start to everyone in lobby
    sendGameAction({
      type: "trivia_session_start",
      questions: qList,
      startedBy: currentUsername,
    });

    onAnnounceToChat?.(`🧠 ${currentUsername} canlı TRIVIA Bilgi Yarışması başlattı! (5 Soru)`);
  };

  // Listen to incoming game events from other users
  useEffect(() => {
    if (!incomingGameEvent) return;
    const { sender_id, sender_username, data } = incomingGameEvent;
    if (!data || typeof data !== "object") return;

    if (data.type === "trivia_session_start" && data.questions) {
      setQuestions(data.questions);
      setCurrentQIndex(0);
      setTimeLeft(QUESTION_DURATION);
      setSelectedOption(null);
      setIsRevealed(false);
      setIsFinished(false);
      setScores({
        [sender_id]: { username: sender_username, score: 0 },
      });
    } else if (data.type === "trivia_answer") {
      const { points, isCorrect } = data;
      setScores((prev) => {
        const existing = prev[sender_id] || { username: sender_username, score: 0 };
        return {
          ...prev,
          [sender_id]: {
            username: sender_username,
            score: existing.score + (isCorrect ? (points || 100) : 0),
          },
        };
      });
    } else if (data.type === "trivia_next_question") {
      if (data.index !== undefined) {
        setCurrentQIndex(data.index);
        setTimeLeft(QUESTION_DURATION);
        setSelectedOption(null);
        setIsRevealed(false);
      }
    } else if (data.type === "trivia_finished") {
      setIsFinished(true);
      if (data.scores) {
        setScores(data.scores);
      }
    }
  }, [incomingGameEvent]);

  // Start initial game if opened and empty
  useEffect(() => {
    if (isActive && questions.length === 0) {
      startNewTrivia();
    }
  }, [isActive]);

  // Question countdown timer
  useEffect(() => {
    if (!isActive || isFinished || isRevealed || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isFinished, isRevealed, currentQIndex, questions.length]);

  const handleTimeExpired = () => {
    setIsRevealed(true);
    advanceToNextQuestion();
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || isRevealed) return;

    setSelectedOption(idx);
    setIsRevealed(true);

    const currentQ = questions[currentQIndex];
    const isCorrect = idx === currentQ.correctIndex;
    const earnedPoints = isCorrect ? 100 + timeLeft * 10 : 0;

    // Update local score
    setScores((prev) => {
      const existing = prev[currentUserId] || { username: currentUsername, score: 0 };
      return {
        ...prev,
        [currentUserId]: {
          username: currentUsername,
          score: existing.score + earnedPoints,
        },
      };
    });

    // Broadcast answer to lobby
    sendGameAction({
      type: "trivia_answer",
      questionIndex: currentQIndex,
      isCorrect,
      points: earnedPoints,
    });

    advanceToNextQuestion();
  };

  const advanceToNextQuestion = () => {
    if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);

    nextQuestionTimeoutRef.current = setTimeout(() => {
      if (currentQIndex + 1 < questions.length) {
        const nextIdx = currentQIndex + 1;
        setCurrentQIndex(nextIdx);
        setTimeLeft(QUESTION_DURATION);
        setSelectedOption(null);
        setIsRevealed(false);

        sendGameAction({
          type: "trivia_next_question",
          index: nextIdx,
        });
      } else {
        // Finished all questions
        setIsFinished(true);
        sendGameAction({
          type: "trivia_finished",
          scores,
        });

        // Find winner
        const sorted = Object.values(scores).sort((a, b) => b.score - a.score);
        if (sorted.length > 0) {
          onAnnounceToChat?.(
            `🏆 Trivia Bilgi Yarışması Sona Erdi! Şampiyon: ${sorted[0].username} (${sorted[0].score} Puan) 🌟`
          );
        }
      }
    }, 3500);
  };

  if (!isActive) return null;

  const currentQ = questions[currentQIndex];
  const sortedLeaderboard = Object.values(scores).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-gradient-to-r from-[#FEF08A] via-[#FED7AA] to-[#FBCFE8] border-b-4 border-black p-4 shrink-0 transition-all shadow-[0_4px_0_0_rgba(0,0,0,1)] relative z-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-black text-white font-black text-xs px-2.5 py-1 brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            🧠 CANLI TRIVIA
          </Badge>
          {!isFinished && currentQ && (
            <>
              <Badge className="bg-[#4ADE80] text-black font-black text-xs px-2 py-0.5 brutal-border">
                {currentQ.category}
              </Badge>
              <span className="font-black text-sm text-black">
                Soru {currentQIndex + 1} / {questions.length}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isFinished && (
            <div className="flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-1 rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-black text-sm">
              <Clock className={`w-4 h-4 ${timeLeft <= 5 ? "text-red-600 animate-bounce" : "text-black"}`} />
              <span className={timeLeft <= 5 ? "text-red-600 font-extrabold" : "text-black"}>
                {timeLeft}s
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 bg-white hover:bg-red-200 border-2 border-black rounded-sm flex items-center justify-center font-bold text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timer progress bar */}
      {!isFinished && (
        <div className="w-full bg-white border-2 border-black h-2.5 mb-3 rounded-full overflow-hidden shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft > 8 ? "bg-[#4ADE80]" : timeLeft > 4 ? "bg-[#FACC15]" : "bg-[#EF4444]"
            }`}
            style={{ width: `${(timeLeft / QUESTION_DURATION) * 100}%` }}
          />
        </div>
      )}

      {/* Main Content: Question or Finished Podium */}
      {isFinished ? (
        <div className="bg-white border-3 border-black p-4 rounded-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center animate-fade-in">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-[#EAB308] animate-bounce" />
            <h3 className="text-2xl font-black text-black">TRIVIA ŞAMPİYONLUK KÜRSÜSÜ</h3>
          </div>
          <p className="text-sm font-bold text-gray-700 mb-4">
            Tebrikler! 5 soruluk bilgi yarışması tamamlandı.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 max-w-xl mx-auto">
            {sortedLeaderboard.map((player, rank) => {
              const rankBgs = [
                "bg-[#FEF08A] border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]",
                "bg-[#E2E8F0] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
                "bg-[#FED7AA] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
              ];
              const medalIcons = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={player.username}
                  className={`p-3 border-2 rounded-sm ${rankBgs[rank] || "bg-white border-black"}`}
                >
                  <div className="text-xl mb-1">{medalIcons[rank] || `#${rank + 1}`}</div>
                  <div className="font-black text-base truncate">{player.username}</div>
                  <div className="font-extrabold text-sm text-black/80">{player.score} Puan</div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={startNewTrivia}
              className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-black border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Zap className="w-4 h-4 mr-2" /> Yeni Tur Başlat
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-black font-black border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
            >
              Kapat
            </Button>
          </div>
        </div>
      ) : currentQ ? (
        <div className="space-y-3">
          {/* Question Text Card */}
          <div className="bg-white border-3 border-black p-3.5 rounded-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            <p className="text-base md:text-lg font-black text-black leading-snug">
              {currentQ.question}
            </p>
          </div>

          {/* 4 Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {currentQ.options.map((opt, idx) => {
              const letter = ["A", "B", "C", "D"][idx];
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnStyle = "bg-white hover:bg-[#FEF08A] border-2 border-black text-black";
              if (isRevealed) {
                if (isCorrect) {
                  btnStyle = "bg-[#4ADE80] border-2 border-black text-black font-black";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-[#F87171] border-2 border-black text-white font-black line-through";
                } else {
                  btnStyle = "bg-gray-100 border-2 border-gray-400 text-gray-500 opacity-60";
                }
              } else if (isSelected) {
                btnStyle = "bg-[#67E8F9] border-2 border-black text-black font-black";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isRevealed || selectedOption !== null}
                  className={`flex items-center gap-3 p-2.5 rounded-sm font-bold text-left transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] cursor-pointer disabled:cursor-default ${btnStyle}`}
                >
                  <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">
                    {letter}
                  </span>
                  <span className="flex-1 text-sm md:text-base leading-tight font-extrabold break-words">
                    {opt}
                  </span>
                  {isRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-black shrink-0" />}
                  {isRevealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Live Mini Leaderboard Bar */}
          {sortedLeaderboard.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-black uppercase text-black/70 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Canlı Skorlar:
              </span>
              {sortedLeaderboard.map((p) => (
                <span
                  key={p.username}
                  className="bg-white border border-black text-xs font-bold px-2 py-0.5 rounded-sm shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                >
                  {p.username}: <strong className="text-black">{p.score}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
