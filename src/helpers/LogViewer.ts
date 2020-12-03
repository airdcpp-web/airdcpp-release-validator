import { Context } from 'types';


const postData = (path: string, data: string, { application, axios }: Context) => {
  const baseUrl = (application.server.secure ? 'https://' : 'http://') + application.server.address;
  return axios({
    url: `${baseUrl}/${path}`,
    method: 'POST',
    headers: {
      'Authorization': `${application.session.tokenType} ${application.session.token}`,
    },
    data,
  })
};

export const openLog = async (text: string, context: Context) => {
  // Upload text
  const { api, generateResultLogName } = context;
  const fileUploadRes = await postData('temp', text, context);
  const tempFileId = fileUploadRes.headers['location'];

  // Create a temp share item so that we get a TTH to view
  const tempShareRes = await api.postTempShare(tempFileId, generateResultLogName());

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
