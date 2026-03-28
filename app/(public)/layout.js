import NavbarPublic from "../../app/components/Navbar"
import Footer from "../../app/components/Footer"

export default function PublicLayout({ children }) {
  return (
    <>
      <NavbarPublic />
      {children}
      <Footer />
    </>
  )
}