import { Context } from 'types';


const postData = (path: string, body: string, { application, fetch }: Context) => {
  const baseUrl = (application.server.secure ? 'https://' : 'http://') + application.server.address;
  return fetch(`${baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `${application.session.tokenType} ${application.session.token}`,
    },
    body,
  })
};

export const openLog = async (text: string, context: Context) => {
  // Upload text
  const { api, generateResultLogName } = context;
  const fileUploadRes = await postData('temp', text, context);
  const tempFileId = fileUploadRes.headers.get('location')!;

  // Create a temp share item so that we get a TTH to view
  const tempShareRes = await api.postTempShare(tempFileId, generateResultLogName(), context.application.cid);

  try {
    // View it
    const { tth } = tempShareRes.item;
    await api.createViewFile(tth);
  } catch (e) {
    throw e;
  } finally {
    await api.deleteTempShare(tempShareRes.item.id);
  }
};
