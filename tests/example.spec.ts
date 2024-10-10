import { test, expect } from '@playwright/test';
import { CosmosConnector } from '../_helpers/db/cosmos';

test('add product to db', async ({}) => {
  let cc : CosmosConnector = new CosmosConnector();
  await cc.addProduct({id: "1", name: "Demo product"});
});
