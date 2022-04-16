import { useEffect, useState } from 'react';
import { useReactBundleContext } from '@pandino/pandino-react-dom';
import { ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
import { SettingsModel } from 'pokedex-application-contract';

const defaultSettings: SettingsModel = {
  maxNumberOfElements: 100,
};

export function Settings() {
  const bundleContext = useReactBundleContext();
  const [settings, setSettings] = useState<SettingsModel | undefined>(undefined);

  useEffect(() => {
    const configAdminReference = bundleContext.getServiceReference(
      '@pandino/pandino-configuration-management/ConfigurationAdmin',
    );
    const configAdmin = bundleContext.getService<ConfigurationAdmin>(configAdminReference);
    const mstConfig = configAdmin.getConfiguration('pokedex.settings');
    const configFromStore: SettingsModel = mstConfig.getProperties() as SettingsModel;

    if (!configFromStore) {
      mstConfig.update({
        ...defaultSettings,
      });
    }

    setSettings({
      ...(mstConfig.getProperties() as any),
    });

    return () => {
      bundleContext.ungetService(configAdminReference);
    };
  }, []);

  useEffect(() => {
    const configAdminReference = bundleContext.getServiceReference(
      '@pandino/pandino-configuration-management/ConfigurationAdmin',
    );
    const configAdmin = bundleContext.getService<ConfigurationAdmin>(configAdminReference);
    const mstConfig = configAdmin.getConfiguration('pokedex.settings');

    if (settings) {
      mstConfig.update({
        ...settings,
      });
    }

    return () => {
      bundleContext.ungetService(configAdminReference);
    };
  }, [settings]);

  function updateMax(maxNumberOfElements: number) {
    setSettings({
      ...(settings || ({} as any)),
      maxNumberOfElements,
    });
  }

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Settings</h1>
      </div>
      {settings ? (
        <div className="col-md-7 col-lg-8">
          <form>
            <div className="row g-3">
              <div className="col-sm-6">
                <label htmlFor="maxNumberOfElements" className="form-label">
                  Max num. of Elements
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="maxNumberOfElements"
                  value={settings!.maxNumberOfElements}
                  onChange={(val) => updateMax(Number(val.target.value))}
                  required
                />
              </div>
            </div>
          </form>
        </div>
      ) : (
        ''
      )}
    </>
  );
}
