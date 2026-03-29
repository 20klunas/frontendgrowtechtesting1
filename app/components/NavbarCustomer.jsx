import NavbarCustomerClient from "./NavbarCustomerClient";

export default function NavbarCustomer({ initialShellData }) {
  return (
    <NavbarCustomerClient initialShellData={initialShellData ?? {}} />
  );
}