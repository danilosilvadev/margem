import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Shell } from "@/components/Shell"
import { BookPage } from "@/pages/BookPage"
import { LibraryPage } from "@/pages/LibraryPage"
import { ReaderPage } from "@/pages/ReaderPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { AppProvider } from "@/state/AppProvider"

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/book/:bookId" element={<BookPage />} />
            <Route path="/read/:bookId/:chapterId" element={<ReaderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Missing />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

function Missing() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <h1 className="font-serif text-3xl">That page is not in the book.</h1>
      <a className="mt-4 inline-block text-accent" href="/">
        Return to the shelf
      </a>
    </main>
  )
}
