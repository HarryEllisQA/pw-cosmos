import { CosmosConnector } from '../_helpers/db/cosmos';
import { expect, test } from '../fixtures/fixtures';

test('add product to db', async ({ db }) => {

  await db.addItem({id: '00001', name: 'Test Item #1'}/*, {id: '00002', name: 'Test Item #2'}, {id: '00003', name: 'Test Item #3'}*/);
  await db.addItem({id: '00002', name: 'Test Item #2'});
  await db.addItem({id: '00003', name: 'Test Item #3'});
  await db.removeItem({id: '00002', name: 'Test Item #2'});

});
