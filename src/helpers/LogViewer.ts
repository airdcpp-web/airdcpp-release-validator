import { Context } from 'types';


const postData = async (path: string, body: string, { application, fetch, logger }: Context) => {
  const baseUrl = (application.server.secure ? 'https://' : 'http://') + application.server.address;
  
  const url = `${baseUrl}/${path}`;

  logger.verbose(`POST data to ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `${application.session.tokenType} ${application.session.token}`,
    },
    body,
  });

  if (response.status >= 400) {
    logger.error(`POST response error: ${response.status} ${response.statusText}`, await response.text());
    throw new Error(`Failed to post data to ${url}: ${response.status} ${response.statusText}`);
  } else {
    logger.verbose(`POST succeeded`);
  }

  return response;
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
