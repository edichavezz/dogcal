import Image from 'next/image';

type Friend = {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
};

type PupFriendsListProps = {
  friends: Friend[];
  pupName: string;
};

const MAX_VISIBLE = 4;

export default function PupFriendsList({ friends }: PupFriendsListProps) {
  if (!friends || friends.length === 0) return null;

  const visible = friends.slice(0, MAX_VISIBLE);
  const overflow = friends.length - MAX_VISIBLE;

  return (
    <div className="border-t border-gray-100 pt-2 mt-2">
      <div className="flex flex-wrap gap-1">
        {visible.map((friend) => {
          const firstName = friend.name.split(' ')[0];
          return (
            <span
              key={friend.id}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
            >
              {friend.profilePhotoUrl ? (
                <Image
                  src={friend.profilePhotoUrl}
                  alt={firstName}
                  width={14}
                  height={14}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="w-3.5 h-3.5 bg-gray-300 rounded-full inline-flex items-center justify-center text-[8px] text-gray-500 font-medium flex-shrink-0">
                  {firstName[0]}
                </span>
              )}
              {firstName}
            </span>
          );
        })}
        {overflow > 0 && (
          <span className="inline-flex items-center bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
