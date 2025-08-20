import { initSystemConfig } from '.';
import { createDatasetTrainingMongoWatch } from '@/service/core/dataset/training/utils';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { debounce } from 'lodash';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';
import { getAppTemplatesAndLoadThem } from '@fastgpt/templates/register';
import { watchSystemModelUpdate } from '@fastgpt/service/core/ai/config/utils';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { refetchSystemPlugins } from '@fastgpt/service/core/app/plugin/controller';

export const startMongoWatch = async () => {
  reloadConfigWatch();
  createDatasetTrainingMongoWatch();
  refetchAppTemplates();
  watchSystemModelUpdate();
  refetchSystemPlugins();
};

const reloadConfigWatch = () => {
  try {
    const changeStream = MongoSystemConfigs.watch();

    changeStream.on('change', async (change) => {
      try {
        if (
          change.operationType === 'update' ||
          (change.operationType === 'insert' &&
            [SystemConfigsTypeEnum.fastgptPro, SystemConfigsTypeEnum.license].includes(
              change.fullDocument.type
            ))
        ) {
          await initSystemConfig();
          console.log('refresh system config');
        }
      } catch (error) {}
    });

    changeStream.on('error', (error) => {
      console.warn('MongoDB change stream error (system config):', error.message);
    });
  } catch (error: any) {
    if (error?.code === 40573) {
      console.warn(
        'MongoDB Change Streams not supported: MongoDB must be configured as a replica set'
      );
    } else {
      console.error('Failed to setup system config watch:', error);
    }
  }
};

const refetchAppTemplates = () => {
  try {
    const changeStream = MongoAppTemplate.watch();

    changeStream.on(
      'change',
      debounce(async (change) => {
        setTimeout(() => {
          try {
            getAppTemplatesAndLoadThem(true);
          } catch (error) {}
        }, 5000);
      }, 500)
    );

    changeStream.on('error', (error) => {
      console.warn('MongoDB change stream error (app templates):', error.message);
    });
  } catch (error: any) {
    if (error?.code === 40573) {
      console.warn('MongoDB Change Streams not supported for app templates');
    } else {
      console.error('Failed to setup app templates watch:', error);
    }
  }
};
