import { Workspace } from '../models/workspaceModel.js';

export default async function generateInviteCode() {
    let unique = false;
    let inviteCode = '';
    
    while (!unique) {
        inviteCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code
        const existingWorkspace = await Workspace.findOne({ inviteCode });
        if (!existingWorkspace) {
            unique = true;
        }
    }
    
    return inviteCode;
}