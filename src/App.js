import ProtectedLayout from "./components/layout/ProtectedLayout";
// ...rest of imports

// inside return (
<Routes>
  {/* Public */}
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/login" element={<Login />} />

  {/* Protected layout wraps all private pages and provides <Outlet/> */}
  <Route element={<RequireAuth><ProtectedLayout /></RequireAuth>}>
    <Route
      path="/dashboard"
      element={
        isLoading ? (
          <Loading />
        ) : (
          <Dashboard
            submissions={submissions}
            workspaces={workspaces}
            users={users}
            currentUser={currentUser}
            filterWorkspace={filterWorkspace}
            setFilterWorkspace={setFilterWorkspace}
            filterType={filterType}
            setFilterType={setFilterType}
            onSelectSubmission={onSelectSubmission}
          />
        )
      }
    />
    <Route
      path="/content"
      element={
        /* placeholder for now */
        <div className="max-w-6xl mx-auto p-6">Content page</div>
      }
    />
    <Route
      path="/audits"
      element={<div className="max-w-6xl mx-auto p-6">Audits</div>}
    />
    <Route
      path="/seo-reports"
      element={<div className="max-w-6xl mx-auto p-6">SEO Reports</div>}
    />
    <Route
      path="/users"
      element={<ManageUsers users={users} currentUser={currentUser} onAddUser={addUser} />}
    />
    <Route
      path="/workspaces"
      element={<ManageWorkspaces workspaces={workspaces} currentUser={currentUser} onAddWorkspace={addWorkspace} />}
    />
    <Route
      path="/review/:id"
      element={
        <ReviewRoute
          users={users}
          workspaces={workspaces}
          currentUser={currentUser}
          onApprove={onApprove}
          onReject={onReject}
          feedback={feedback}
          onFeedbackChange={setFeedback}
        />
      }
    />
  </Route>

  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
// )
