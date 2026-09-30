import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCcw, Send, Zap } from "lucide-react";

const MAX_MESSAGES = 3;
const POLL_INTERVAL_MS = 3000;

type MessageRecord = {
  id: number;
  createdAt: number;
  eventDeliveredAt: number;
  pollingDeliveredAt: number | null;
};

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const parts = [date.getHours(), date.getMinutes(), date.getSeconds()].map((v) =>
    String(v).padStart(2, "0"),
  );
  return parts.join(":") + "." + String(date.getMilliseconds()).padStart(3, "0");
}

function MessageRow({
  message,
  mode,
}: {
  message: MessageRecord;
  mode: "event" | "polling";
}) {
  const deliveredAt =
    mode === "event" ? message.eventDeliveredAt : message.pollingDeliveredAt;
  const pending = deliveredAt === null;
  const delay = deliveredAt === null ? 0 : deliveredAt - message.createdAt;

  return (
    <div
      className={
        "rounded-xl border p-3 transition-colors " +
        (pending
          ? "border-amber-500/25 bg-amber-500/5"
          : mode === "event"
            ? "border-violet-500/20 bg-violet-500/5"
            : "border-emerald-500/20 bg-emerald-500/5")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            {pending ? (
              <Clock3 className="text-amber-600 dark:text-amber-400" size={14} />
            ) : (
              <CheckCircle2
                className={
                  mode === "event"
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
                size={14}
              />
            )}
            메시지 #{message.id} {pending ? "대기 중" : "발송됨"}
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            클릭 {formatTime(message.createdAt)}
            {mode === "polling" && !pending ? " · 대기 " + (delay / 1000).toFixed(2) + "초" : ""}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[10px] font-bold text-foreground">
          {pending ? "WAIT" : formatTime(deliveredAt)}
        </span>
      </div>
    </div>
  );
}

export default function EventDrivenVsPollingViz() {
  const startedAt = Date.now();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [now, setNow] = useState(startedAt);
  const [nextPollAt, setNextPollAt] = useState(startedAt + POLL_INTERVAL_MS);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const polledAt = Date.now();
      setMessages((current) =>
        current.map((message) =>
          message.pollingDeliveredAt === null
            ? { ...message, pollingDeliveredAt: polledAt }
            : message,
        ),
      );
      setLastPollAt(polledAt);
      setNextPollAt(polledAt + POLL_INTERVAL_MS);
      setNow(polledAt);
    }, Math.max(0, nextPollAt - Date.now()));

    return () => window.clearTimeout(timer);
  }, [nextPollAt]);

  const countdownMs = Math.max(0, nextPollAt - now);
  const pendingCount = messages.filter((message) => message.pollingDeliveredAt === null).length;
  const isLimitReached = messages.length >= MAX_MESSAGES;

  const sendMessage = () => {
    if (isLimitReached) return;
    const sentAt = Date.now();
    setMessages((current) => {
      if (current.length >= MAX_MESSAGES) return current;
      return [
        ...current,
        {
          id: current.length + 1,
          createdAt: sentAt,
          eventDeliveredAt: sentAt,
          pollingDeliveredAt: null,
        },
      ];
    });
    setNow(sentAt);
  };

  const resetDemo = () => {
    const resetAt = Date.now();
    setMessages([]);
    setLastPollAt(null);
    setNextPollAt(resetAt + POLL_INTERVAL_MS);
    setNow(resetAt);
  };

  return (
    <div className="space-y-5 py-1">
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap className="text-primary" size={17} /> 같은 클릭, 다른 처리 타이밍
            </h3>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              같은 메시지를 두 방식에 동시에 넣습니다. 이벤트 기반은 즉시 처리하고,
              폴링은 3초마다 실행되는 다음 조회 시점에 처리합니다.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={sendMessage}
              disabled={isLimitReached}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send size={15} /> 메시지 발송 {messages.length}/{MAX_MESSAGES}
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <RefreshCcw size={15} /> 초기화
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background px-3 py-2.5">
            <span className="text-[10px] text-muted-foreground">현재 시각</span>
            <div className="mt-1 font-mono font-bold text-foreground">{formatTime(now)}</div>
          </div>
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">EVENT-DRIVEN</span>
            <div className="mt-1 font-semibold text-foreground">이벤트 발생 즉시 처리</div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">POLLING · 3s</span>
            <div className="mt-1 flex justify-between gap-2 font-semibold text-foreground">
              <span>다음 조회</span>
              <span className="font-mono">{(countdownMs / 1000).toFixed(1)}초</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-violet-500/25 bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h4 className="text-sm font-bold text-foreground">이벤트 기반</h4>
              <p className="mt-0.5 text-[10px] text-muted-foreground">클릭 → 이벤트 발행 → Consumer 처리</p>
            </div>
            <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300">즉시 반응</span>
          </div>
          <div className="mt-3 rounded-xl border border-violet-500/15 bg-violet-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
            고정 조회 주기를 기다리지 않습니다. 여기서 즉시는 지연이 0이라는 뜻이 아니라
            폴링 주기 대기가 없다는 의미입니다.
          </div>
          <div className="mt-3 space-y-2" aria-live="polite">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">메시지를 발송하면 처리 시각이 즉시 표시됩니다.</div>
            ) : (
              messages.map((message) => <MessageRow key={"event-" + message.id} message={message} mode="event" />)
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/25 bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h4 className="text-sm font-bold text-foreground">폴링</h4>
              <p className="mt-0.5 text-[10px] text-muted-foreground">클릭 → 대기 상태 → 3초 주기 조회 → 처리</p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-800 dark:text-amber-300">대기 {pendingCount}건</span>
          </div>
          <div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{lastPollAt ? "마지막 조회 " + formatTime(lastPollAt) : "아직 첫 조회 전"}</span>
              <span className="font-mono font-bold text-amber-800 dark:text-amber-300">T-{(countdownMs / 1000).toFixed(1)}s</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-500/10">
              <div
                className="h-full rounded-full bg-amber-500 transition-[width] duration-100"
                style={{ width: String(((POLL_INTERVAL_MS - countdownMs) / POLL_INTERVAL_MS) * 100) + "%" }}
              />
            </div>
          </div>
          <div className="mt-3 space-y-2" aria-live="polite">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">메시지를 발송하면 다음 폴링까지 대기합니다.</div>
            ) : (
              messages.map((message) => <MessageRow key={"poll-" + message.id} message={message} mode="polling" />)
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        데모의 3초 간격은 비교를 위한 고정 값입니다. 실제 폴링 주기는 허용 지연, 사용자 수,
        서버 부하와 변경 빈도를 함께 고려해 정합니다.
      </p>
    </div>
  );
}
