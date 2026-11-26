/** Honest placeholder: there is no authentication yet, so no user is shown. */
export function UserArea() {
  return (
    <div className="user-area">
      <span className="user-area__avatar" aria-hidden="true">
        ?
      </span>
      <div className="user-area__text">
        <span className="user-area__name">Guest</span>
        <span className="user-area__meta">Not signed in. Authentication is planned for Module B.</span>
      </div>
    </div>
  );
}
