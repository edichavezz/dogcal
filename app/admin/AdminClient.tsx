'use client';

/**
 * Admin Client Component
 *
 * Single-page admin interface with:
 * - Quick access user buttons
 * - Action buttons for adding users/pups (modals)
 * - Users table with login tokens and actions
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PawsIcon from '../components/PawsIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import PawsLoader from '../components/ui/PawsLoader';
import { User, Pup } from '@prisma/client';

type UserWithPups = User & { ownedPups?: Pup[] };

interface TokenData {
  userId: string;
  name: string;
  role: string;
  phoneNumber: string | null;
  token: string;
  password: string;
  loginUrl: string;
}

type Meetup = {
  id: string;
  startAt: string;
  endAt: string;
  location: string;
};

export default function AdminClient() {
  const [users, setUsers] = useState<UserWithPups[]>([]);
  const [pups, setPups] = useState<Pup[]>([]);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generatingMeetups, setGeneratingMeetups] = useState(false);

  // Modal states
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddPup, setShowAddPup] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData();
    fetchMeetups();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, pupsRes, tokensRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/pups'),
        fetch('/api/admin/tokens'),
      ]);

      if (!usersRes.ok || !pupsRes.ok || !tokensRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const usersData = await usersRes.json();
      const pupsData = await pupsRes.json();
      const tokensData = await tokensRes.json();

      setUsers(usersData.users || []);
      setPups(pupsData.pups || []);
      setTokens(tokensData.tokens || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetups = async () => {
    try {
      const res = await fetch('/api/meetups');
      const data = await res.json();
      setMeetups(data.meetups || []);
    } catch (error) {
      console.error('Error fetching meetups:', error);
    }
  };

  const handleGenerateMeetups = async () => {
    setGeneratingMeetups(true);
    try {
      const res = await fetch('/api/meetups', { method: 'POST' });
      const data = await res.json();
      showMessage('success', `Generated ${data.created} new meetup${data.created !== 1 ? 's' : ''}!`);
      fetchMeetups();
    } catch {
      showMessage('error', 'Failed to generate meetups');
    } finally {
      setGeneratingMeetups(false);
    }
  };

  const handleDeleteMeetup = async (meetupId: string) => {
    if (!confirm('Delete this meetup date?')) return;
    try {
      const res = await fetch(`/api/meetups/${meetupId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setMeetups((prev) => prev.filter((m) => m.id !== meetupId));
      showMessage('success', 'Meetup deleted');
    } catch {
      showMessage('error', 'Failed to delete meetup');
    }
  };

  const formatMeetupDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatMeetupTime = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUserLogin = async (userId: string) => {
    setLoginLoading(userId);
    try {
      const response = await fetch('/api/acting-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        router.push('/calendar');
      } else {
        showMessage('error', 'Failed to log in as user');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Failed to log in as user');
    } finally {
      setLoginLoading(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const sendWhatsApp = (phoneNumber: string, loginUrl: string, password: string) => {
    const message = encodeURIComponent(
      `Welcome to DogCal! You can log in using this link:\n\n${loginUrl}\n\nIf you're asked for a password, yours is: ${password}\n\nEnjoy, and reach out to Edi with any questions!`
    );
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const regenerateAllPasswords = async () => {
    if (!confirm('This will regenerate memorable passwords for ALL users. Their old login links will stop working. Continue?')) {
      return;
    }
    setRegenerating(true);
    try {
      const response = await fetch('/api/admin/regenerate-passwords', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      showMessage('success', `Regenerated ${data.count} passwords!`);
      fetchData(); // Refresh the table
    } catch {
      showMessage('error', 'Failed to regenerate passwords');
    } finally {
      setRegenerating(false);
    }
  };

  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.includes('supabase.co');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <PawsLoader size="lg" message="Loading admin..." />
      </div>
    );
  }

  const owners = users.filter(u => u.role === 'OWNER');
  const friends = users.filter(u => u.role === 'FRIEND');

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <PawsIcon size={40} color="teal" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
              DogCal Admin
            </h1>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-4 rounded-xl p-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Quick Login Section */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Login</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddOwner(true)}
                  className="px-3 py-1.5 text-sm bg-[#1a3a3a] text-white rounded-lg hover:bg-[#2a4a4a] transition-colors"
                >
                  + Owner
                </button>
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="px-3 py-1.5 text-sm bg-[#f4a9a8] text-[#1a3a3a] rounded-lg hover:bg-[#f4a9a8]/80 transition-colors"
                >
                  + Friend
                </button>
                <button
                  onClick={() => setShowAddPup(true)}
                  className="px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  + Pup
                </button>
              </div>
            </div>

            {/* Owners */}
            {owners.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Owners</p>
                <div className="flex flex-wrap gap-2">
                  {owners.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserLogin(user.id)}
                      disabled={loginLoading === user.id}
                      className="flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all border-gray-200 hover:border-[#1a3a3a] bg-white hover:bg-[#1a3a3a]/5 disabled:opacity-50"
                    >
                      {isValidImageUrl(user.profilePhotoUrl) ? (
                        <Image src={user.profilePhotoUrl!} alt={user.name} width={24} height={24} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 bg-[#1a3a3a]/10 rounded-full flex items-center justify-center">
                          <span className="text-xs text-[#1a3a3a] font-semibold">{user.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-sm font-medium">{user.name}</span>
                      {loginLoading === user.id && <LoadingSpinner size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Friends */}
            {friends.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Friends</p>
                <div className="flex flex-wrap gap-2">
                  {friends.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserLogin(user.id)}
                      disabled={loginLoading === user.id}
                      className="flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all border-gray-200 hover:border-[#f4a9a8] bg-white hover:bg-[#f4a9a8]/10 disabled:opacity-50"
                    >
                      {isValidImageUrl(user.profilePhotoUrl) ? (
                        <Image src={user.profilePhotoUrl!} alt={user.name} width={24} height={24} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 bg-[#f4a9a8]/20 rounded-full flex items-center justify-center">
                          <span className="text-xs text-[#1a3a3a] font-semibold">{user.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-sm font-medium">{user.name}</span>
                      {loginLoading === user.id && <LoadingSpinner size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Users Table with Tokens */}
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All Users & Login Links</h2>
              <button
                onClick={regenerateAllPasswords}
                disabled={regenerating}
                className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 font-medium transition-colors"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate All Passwords'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Login URL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tokens.map(token => (
                    <tr key={token.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{token.name}</div>
                        {token.phoneNumber && (
                          <div className="text-xs text-gray-500">{token.phoneNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          token.role === 'OWNER'
                            ? 'bg-[#1a3a3a]/10 text-[#1a3a3a] border-[#1a3a3a]/20'
                            : 'bg-[#f4a9a8]/20 text-[#1a3a3a] border-[#f4a9a8]/30'
                        }`}>
                          {token.role === 'OWNER' ? 'Owner' : 'Friend'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-amber-50 px-2 py-1 rounded text-amber-800 font-medium">
                            {token.password}
                          </code>
                          <button
                            onClick={() => copyToClipboard(token.password)}
                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                              copiedUrl === token.password
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {copiedUrl === token.password ? '!' : 'Copy'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all text-gray-700">
                          {token.loginUrl}
                        </code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(token.loginUrl)}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                              copiedUrl === token.loginUrl
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {copiedUrl === token.loginUrl ? 'Copied!' : 'Copy URL'}
                          </button>
                          {token.phoneNumber && (
                            <button
                              onClick={() => sendWhatsApp(token.phoneNumber!, token.loginUrl, token.password)}
                              className="px-2.5 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                            >
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-3 text-sm text-gray-600">
              <strong>Total:</strong> {tokens.length} users ({tokens.filter(t => t.role === 'OWNER').length} owners, {tokens.filter(t => t.role === 'FRIEND').length} friends)
            </div>
          </div>

          {/* Community Meetups Section */}
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Community Meetups</h2>
              <button
                onClick={handleGenerateMeetups}
                disabled={generatingMeetups}
                className="px-3 py-1.5 text-sm bg-[#1a3a3a] text-white rounded-lg hover:bg-[#2a4a4a] disabled:bg-gray-300 font-medium transition-colors"
              >
                {generatingMeetups ? 'Generating...' : 'Generate next 8 Sundays'}
              </button>
            </div>

            {meetups.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No upcoming meetups. Click &quot;Generate next 8 Sundays&quot; to create them.</p>
            ) : (
              <div className="space-y-2">
                {meetups.map((meetup) => (
                  <div key={meetup.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatMeetupDate(meetup.startAt)} &middot; {formatMeetupTime(meetup.startAt, meetup.endAt)}
                      </p>
                      <p className="text-xs text-gray-500">{meetup.location}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeetup(meetup.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium ml-4"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Owner Modal */}
      {showAddOwner && (
        <Modal title="Add New Owner" onClose={() => setShowAddOwner(false)}>
          <AddOwnerForm onSuccess={() => { fetchData(); setShowAddOwner(false); showMessage('success', 'Owner added!'); }} />
        </Modal>
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <Modal title="Add New Friend" onClose={() => setShowAddFriend(false)}>
          <AddFriendForm pups={pups} onSuccess={() => { fetchData(); setShowAddFriend(false); showMessage('success', 'Friend added!'); }} />
        </Modal>
      )}

      {/* Add Pup Modal */}
      {showAddPup && (
        <Modal title="Add New Pup" onClose={() => setShowAddPup(false)}>
          <AddPupForm owners={owners} onSuccess={() => { fetchData(); setShowAddPup(false); showMessage('success', 'Pup added!'); }} />
        </Modal>
      )}
    </div>
  );
}

// Modal Component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// Add Owner Form
function AddOwnerForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'OWNER', phoneNumber: formData.phoneNumber || null, address: formData.address || null }),
      });
      if (!response.ok) throw new Error('Failed');
      onSuccess();
    } catch {
      alert('Failed to create owner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="+1234567890" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main St" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <button type="submit" disabled={submitting}
        className="w-full bg-[#1a3a3a] text-white py-2.5 rounded-lg hover:bg-[#2a4a4a] disabled:bg-gray-300 font-medium transition-colors">
        {submitting ? 'Adding...' : 'Add Owner'}
      </button>
    </form>
  );
}

// Add Friend Form
function AddFriendForm({ pups, onSuccess }: { pups: Pup[]; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', address: '' });
  const [selectedPups, setSelectedPups] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'FRIEND', phoneNumber: formData.phoneNumber || null, address: formData.address || null }),
      });
      if (!userResponse.ok) throw new Error('Failed');
      const { user } = await userResponse.json();

      await Promise.all(selectedPups.map(pupId =>
        fetch(`/api/pups/${pupId}/friends`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendUserId: user.id }),
        })
      ));
      onSuccess();
    } catch {
      alert('Failed to create friend');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="+1234567890" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main St" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pups to care for</label>
        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {pups.length === 0 ? (
            <p className="text-gray-500 text-sm">No pups available</p>
          ) : (
            pups.map(pup => (
              <label key={pup.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedPups.includes(pup.id)}
                  onChange={() => setSelectedPups(prev => prev.includes(pup.id) ? prev.filter(id => id !== pup.id) : [...prev, pup.id])}
                  className="rounded border-gray-300" />
                <span className="text-sm">{pup.name}</span>
              </label>
            ))
          )}
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="w-full bg-[#f4a9a8] text-[#1a3a3a] py-2.5 rounded-lg hover:bg-[#f4a9a8]/80 disabled:bg-gray-300 font-medium transition-colors">
        {submitting ? 'Adding...' : 'Add Friend'}
      </button>
    </form>
  );
}

// Add Pup Form
function AddPupForm({ owners, onSuccess }: { owners: UserWithPups[]; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', breed: '', careInstructions: '', ownerUserId: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/pups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed');
      onSuccess();
    } catch {
      alert('Failed to create pup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
        <select required value={formData.ownerUserId} onChange={e => setFormData({ ...formData, ownerUserId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]">
          <option value="">Select owner...</option>
          {owners.map(owner => (
            <option key={owner.id} value={owner.id}>{owner.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
        <input type="text" value={formData.breed} onChange={e => setFormData({ ...formData, breed: e.target.value })}
          placeholder="e.g., Golden Retriever" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
        <textarea value={formData.careInstructions} onChange={e => setFormData({ ...formData, careInstructions: e.target.value })}
          rows={2} placeholder="Special care notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a]" />
      </div>
      <button type="submit" disabled={submitting}
        className="w-full bg-amber-500 text-white py-2.5 rounded-lg hover:bg-amber-600 disabled:bg-gray-300 font-medium transition-colors">
        {submitting ? 'Adding...' : 'Add Pup'}
      </button>
    </form>
  );
}
