import { APISocket } from 'airdcpp-apisocket';

import { SeverityEnum, GroupedPath, ShareRoot, PostTempShareResponse, FilelistItem } from './types/api';


export const API = (socket: APISocket) => {
  const getGroupedShareRoots = async (): Promise<GroupedPath[]> => {
    return socket.get(
      'share/grouped_root_paths'
    );
  };

  const validateSharePath = async (path: string, skipQueueCheck: boolean) => {
    return socket.post(
      'share/validate_path',
      {
        path,
        skip_check_queue: skipQueueCheck,
      }
    );
  };

  const getShareRoot = (id: string) => {
    return socket.get<ShareRoot>(`share_roots/${id}`);
  }

  const postEvent = async (text: string, severity: SeverityEnum) => {
    return socket.post(
      'events',
      {
        text,
        severity,
      }
    );
  };

  const postTempShare = (tempFileId: string, name: string, cid: string | undefined) => {
    return socket.post<PostTempShareResponse>('share/temp_shares', {
      file_id: tempFileId,
      cid,
      name,
    });
  };

  const deleteTempShare = (id: number) => {
    return socket.delete(`share/temp_shares/${id}`);
  };
  
  const createViewFile = (tth: string) => {
    return socket.post(`view_files/${tth}`, {
      text: true,
    });
  };
  
  const getFilelistItem = async (filelistItemId: number, entityId: string) => {
    return socket.get<FilelistItem>(
      `filelists/${entityId}/items/${filelistItemId}`
    );
  };


  return {
    getShareRoot,
    postEvent,
    getGroupedShareRoots,
    validateSharePath,
    getFilelistItem,

    postTempShare,
    deleteTempShare,
    createViewFile,
  };
};

export type APIType = ReturnType<typeof API>;

