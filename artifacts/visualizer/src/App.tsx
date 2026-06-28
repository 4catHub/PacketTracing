import { useState, useEffect } from "react";
import { Link, Route, Switch } from "wouter";
import { Moon, Sun } from "lucide-react";
import Home from "./pages/Home";
import Category from "./pages/Category";
import Detail from "./pages/Detail";
import NotFound from "./pages/not-found";

function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-xl tracking-tight text-primary flex items-center gap-2" data-testid="link-home">
          PacketTracing
        </Link>
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          <Link href="/category/workflows" className="px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            워크플로우
          </Link>
          <Link href="/category/algorithms" className="px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            알고리즘
          </Link>
        </nav>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/category/:cat" component={Category} />
          <Route path="/workflows/:slug" component={Detail} />
          <Route path="/algorithms/:slug" component={Detail} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}
