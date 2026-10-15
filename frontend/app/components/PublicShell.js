import SiteNavigation from "./SiteNavigation";
import SiteFooter from "./SiteFooter";

export default function PublicShell({ children }) {
  return <><SiteNavigation />{children}<SiteFooter /></>;
}