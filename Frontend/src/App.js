import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, useHistory, useLocation } from "react-router-dom";
import { ToastContainer } from './components/Toast';

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import CreatePost from "./pages/CreatePost";
import CreateStory from "./pages/CreateStory";
import Chat from "./pages/Chat";
import HashtagPosts from "./pages/HashtagPosts";
import Settings from "./pages/Settings";

import Sidebar from "./components/Sidebar";
import AIChatbot from "./components/AIChatbot";

import "./App.css";
import "./styles/darkMode.css";

function PageLayout({ children }) {
  return (
    <>
      <Sidebar />
      <div style={{ marginLeft: '270px', padding: '32px 40px' }}>{children}</div>
    </>
  );
}

// Auth listener component to handle logout events
function AuthListener({ children }) {
  const history = useHistory();

  useEffect(() => {
    const handleLogout = () => {
      history.push('/');
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [history]);

  return children;
}

// Chatbot wrapper to only show on dashboard page
function ChatbotWrapper() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  
  return isDashboard ? <AIChatbot /> : null;
}

function App() {
  return (
    <Router>
      <AuthListener>
        <ChatbotWrapper />
        <Switch>
          {/* Auth Routes */}
          <Route path="/" exact component={AuthPage} />
          <Route path="/auth" component={AuthPage} />

        {/* Dashboard (full page layout itself) */}
        <Route path="/dashboard" component={Dashboard} />

        {/* Messages */}
        <Route path="/messages" component={Messages} />

        {/* Connections */}
        <Route
          path="/connections"
          render={() => (
            <PageLayout>
              <Connections />
            </PageLayout>
          )}
        />

        {/* Discover */}
        <Route
          path="/discover"
          render={() => (
            <PageLayout>
              <Discover />
            </PageLayout>
          )}
        />

        {/* Hashtag Posts */}
        <Route
          path="/hashtag/:tag"
          render={() => (
            <PageLayout>
              <HashtagPosts />
            </PageLayout>
          )}
        />

        {/* Profile */}
        <Route
          path="/profile/:userId"
          render={() => (
            <PageLayout>
              <Profile />
            </PageLayout>
          )}
        />
        <Route
          path="/profile"
          exact
          render={() => (
            <PageLayout>
              <Profile />
            </PageLayout>
          )}
        />

        {/* Edit Profile */}
        <Route
          path="/edit-profile"
          render={() => (
            <PageLayout>
              <EditProfile />
            </PageLayout>
          )}
        />

        {/* Create Post */}
        <Route
          path="/create-post"
          render={() => (
            <PageLayout>
              <CreatePost />
            </PageLayout>
          )}
        />

        {/* Create Story */}
        <Route
          path="/create-story"
          render={() => (
            <PageLayout>
              <CreateStory />
            </PageLayout>
          )}
        />

        {/* Chat */}
        <Route
          path="/chat"
          render={() => (
            <PageLayout>
              <Chat />
            </PageLayout>
          )}
        />

        {/* Settings */}
        <Route path="/settings" component={Settings} />
      </Switch>
      </AuthListener>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;
