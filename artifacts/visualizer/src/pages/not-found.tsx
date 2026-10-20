import { Link } from "wouter";

export default function NotFound() {
  return (
    <section className="max-w-xl mx-auto py-20 text-center space-y-4">
      <h1 className="text-2xl font-bold text-foreground">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground">요청한 학습 콘텐츠가 없거나 주소가 올바르지 않습니다.</p>
      <Link href="/" className="text-primary hover:underline">홈으로 돌아가기</Link>
    </section>
  );
}
