import JSZip from 'jszip';
import { Participant } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const parseInstagramZip = async (file: File): Promise<Participant[]> => {
  const zip = new JSZip();
  try {
    const contents = await zip.loadAsync(file);
    
    // Look for the standard file path in Instagram exports
    // It is often in 'followers_and_following/followers.json' or just 'followers.json'
    let followersFile = contents.file('followers_and_following/followers.json');
    if (!followersFile) {
      followersFile = contents.file('followers.json');
    }

    if (!followersFile) {
      throw new Error("followers.json not found in the ZIP file. Please ensure you uploaded the correct file.");
    }

    const jsonText = await followersFile.async('text');
    const jsonData = JSON.parse(jsonText);

    // Instagram export structure varies, usually it's an array of objects wrapping string_list_data
    // or a direct array. We need to normalize.
    let usernames: string[] = [];

    // Helper to extract username
    const extractUsernames = (data: any) => {
       if (Array.isArray(data)) {
         data.forEach((item: any) => {
            if (item.string_list_data && item.string_list_data[0]) {
               usernames.push(item.string_list_data[0].value);
            } else if (item.value) {
               usernames.push(item.value);
            }
         });
       } else if (data.relationships_followers) {
         // Some older formats
          data.relationships_followers.forEach((item: any) => {
            if (item.string_list_data && item.string_list_data[0]) {
               usernames.push(item.string_list_data[0].value);
            }
         });
       }
    };

    extractUsernames(jsonData);

    // Generate Participant objects
    // NOTE: Real-time fetching of HD profile pics via __a=1 is CORS blocked by Instagram.
    // We use a high-quality Avatar generator as a reliable fallback to ensure the game works.
    const participants: Participant[] = usernames.map((username) => {
      // Generate a deterministic color based on username
      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      const color = '#' + '00000'.substring(0, 6 - c.length) + c;

      return {
        id: uuidv4(),
        username: username,
        // Using DiceBear for reliable, nice looking avatars
        photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=${color.replace('#','')}`,
        color: color
      };
    });

    // Limit to 50 for performance demo if thousands are uploaded (WebGL limitation on draw calls)
    // In a production app, we'd use InstancedMesh, but for physics logic simplicity we slice here.
    return participants.slice(0, 50);

  } catch (error) {
    console.error("Failed to parse ZIP:", error);
    throw error;
  }
};

export const generateMockParticipants = (count: number = 10): Participant[] => {
    return Array.from({ length: count }).map((_, i) => {
        const username = `racer_${i + 1}`;
        return {
            id: uuidv4(),
            username,
            photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
            color: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')
        };
    });
}