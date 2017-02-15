import { Ng2KlineFlightPage } from './app.po';

describe('ng2-kline-flight App', function() {
  let page: Ng2KlineFlightPage;

  beforeEach(() => {
    page = new Ng2KlineFlightPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
