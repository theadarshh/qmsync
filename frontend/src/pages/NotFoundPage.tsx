import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import { Link } from "../router/Router";

export function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <div className="page">
      <PageHeader title="Page not found" />
      <div className="card">
        <EmptyState
          title="This page does not exist"
          action={
            <Link to="/" className="button">
              Go to the dashboard
            </Link>
          }
        >
          <p>Check the address, or use the navigation to open a module.</p>
        </EmptyState>
      </div>
    </div>
  );
}
