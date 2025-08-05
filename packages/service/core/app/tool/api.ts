import { RunToolWithStream } from '@fastgpt-sdk/plugin';
import { PluginSourceEnum } from '@fastgpt/global/core/app/plugin/constants';
import { pluginClient, BASE_URL, TOKEN } from '../../../thirdProvider/fastgptPlugin';

export async function APIGetSystemToolList() {
  // Skip plugin call if BASE_URL is empty
  if (!BASE_URL) {
    console.log('No plugin service configured, returning empty tool list');
    return [];
  }

  try {
    const res = await pluginClient.tool.list();

    if (res.status === 200) {
      return res.body.map((item) => {
        return {
          ...item,
          id: `${PluginSourceEnum.systemTool}-${item.id}`,
          parentId: item.parentId ? `${PluginSourceEnum.systemTool}-${item.parentId}` : undefined,
          avatar:
            item.avatar && item.avatar.startsWith('/imgs/tools/')
              ? `/api/system/pluginImgs/${item.avatar.replace('/imgs/tools/', '')}`
              : item.avatar
        };
      });
    }

    return Promise.reject(res.body);
  } catch (error) {
    console.error('Failed to get system tool list:', error);
    return [];
  }
}

const runToolInstance = new RunToolWithStream({
  baseUrl: BASE_URL,
  token: TOKEN
});
export const APIRunSystemTool = runToolInstance.run.bind(runToolInstance);
