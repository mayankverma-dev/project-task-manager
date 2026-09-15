import { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useInviteDetails, useAcceptInvite } from '../hooks/useWorkspaces.js';
import { setActiveWorkspace } from '../workspaceSlice.js';
import { workspacesApi } from '../../../api/workspaces.api.js';

export const AcceptInviteScreen = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUser = useSelector((state) => state.auth.user);

  const { data: invite, isLoading, isError, error } = useInviteDetails(token);
  const acceptMutation = useAcceptInvite();

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing invite token');
      navigate('/');
    }
  }, [token, navigate]);

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(token);
      toast.success('Successfully joined workspace!');
      
      // We need to fetch the user's workspaces again to get the full workspace object
      // and set it as active. 
      const workspaces = await workspacesApi.getWorkspaces();
      if (workspaces && workspaces.length > 0) {
         // Find the one we just joined, but falling back to the first one is fine too
         dispatch(setActiveWorkspace(workspaces[0]));
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to accept invite');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Loading invite details...</p>
      </div>
    );
  }

  if (isError || !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md text-center">
          <div className="text-red-500 w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Invalid Invite</h2>
          <p className="text-gray-600 mt-2">
            {error?.response?.data?.error?.message || "This invite link is invalid or has expired."}
          </p>
          <div className="mt-6">
            <Link to="/" className="text-blue-600 hover:text-blue-500 font-medium">Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            You've been invited!
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Join <span className="font-bold text-gray-900">{invite.workspaceName}</span> as a <span className="capitalize font-semibold">{invite.role}</span>.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Invite sent to: {invite.email}
          </p>
        </div>

        <div className="mt-8">
          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                Please log in or create an account to accept this invitation.
              </p>
              <Link
                to={`/login?returnTo=/accept-invite?token=${token}`}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Log in to accept
              </Link>
              <Link
                to={`/register?returnTo=/accept-invite?token=${token}`}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create an account
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {currentUser?.email !== invite.email && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md text-yellow-700 text-sm">
                  <p className="font-bold">Warning:</p>
                  <p>You are logged in as {currentUser.email}, but this invite is for {invite.email}. You must be logged in with the matching email to accept.</p>
                </div>
              )}
              <button
                onClick={handleAccept}
                disabled={acceptMutation.isPending || currentUser?.email !== invite.email}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acceptMutation.isPending ? 'Accepting...' : 'Accept Invite'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
