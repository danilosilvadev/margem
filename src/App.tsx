import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom"
import { Shell } from "@/components/Shell"
import { BookPage } from "@/pages/BookPage"
import { CommunityPage } from "@/pages/CommunityPage"
import { JourneyPage } from "@/pages/JourneyPage"
import { LibraryPage } from "@/pages/LibraryPage"
import { MapPage } from "@/pages/MapPage"
import { ReaderPage } from "@/pages/ReaderPage"
import { SalonPage } from "@/pages/SalonPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { ShelfPage } from "@/pages/ShelfPage"
import { TreePage } from "@/pages/TreePage"
import { AppProvider } from "@/state/AppProvider"

const rawBase = import.meta.env.BASE_URL
const basename = !rawBase || rawBase === "/" ? undefined : rawBase.replace(/\/$/, "")

export function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/book/:bookId" element={<BookPage />} />
            <Route path="/read/:bookId/:chapterId" element={<ReaderPage />} />
            <Route path="/shelf" element={<ShelfPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/tree" element={<TreePage />} />
            <Route path="/openings" element={<Navigate to="/journey" replace />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/salon/:salonId" element={<SalonPage />} />
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
      <Link className="mt-4 inline-block text-accent" to="/">
        Return to the shelf
      </Link>
    </main>
  )
}
