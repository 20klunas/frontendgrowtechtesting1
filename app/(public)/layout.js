import NavbarPublic from "../components/NavbarPublic"
import Footer from "../components/Footer"

export default function PublicLayout({ children }) {
  return (
    <>
      <NavbarPublic />
      {children}
      <Footer />
    </>
  )
}
