import { TestBed } from '@angular/core/testing';
import { Observable, of, ReplaySubject } from 'rxjs';
import { provideMockActions } from '@ngrx/effects/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import {
  createBook,
  createReadingListItem,
  SharedTestingModule,
} from '@tmo/shared/testing';
import { ReadingListEffects } from './reading-list.effects';
import * as ReadingListActions from './reading-list.actions';
import { Book, okReadsConstants, ReadingListItem } from '@tmo/shared/models';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Action } from '@ngrx/store';

describe('ToReadEffects', () => {
  let actions: Observable<Action>;
  let effects: ReadingListEffects;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTestingModule, MatSnackBarModule],
      providers: [
        ReadingListEffects,
        provideMockActions(() => actions),
      ]
    });

    effects = TestBed.inject(ReadingListEffects);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('loadReadingList$', () => {
    it('should work', done => {
      actions = of(ReadingListActions.init());

      effects.loadReadingList$.subscribe(action => {
        expect(action).toEqual(
          ReadingListActions.loadReadingListSuccess({ list: [] })
        );
        done();
      });

      httpMock.expectOne(`${okReadsConstants.API_LINKS.READING_API}`).flush([]);
    });
  });

  describe('addBook$', () => {
    it('should add book to reading list when confirmedAddToReadingList action is dispatched', (done) => {
      const book: Book = { ...createBook('A'), isAdded: true};
      actions = of(
        ReadingListActions.addToReadingList({ book, showSnackBar: true })
      );

      effects.addBook$.subscribe((action) => {
        expect(action).toEqual(
          ReadingListActions.confirmedAddToReadingList({
            book,
            showSnackBar: true,
          })
        );
        done();
      });

      httpMock
        .expectOne(`${okReadsConstants.API_LINKS.READING_API}`)
        .flush([book]);
    });

    it('should dispatch failedAddToReadingList when api throws an error', (done) => {
      const book: Book = { ...createBook('A'), isAdded: false};
      actions = of(
        ReadingListActions.addToReadingList({ book: book, showSnackBar: false })
      );

      effects.addBook$.subscribe((action) => {
        expect(action).toEqual(
          ReadingListActions.failedAddToReadingList({ book })
        );
        done();
      });

      httpMock
        .expectOne(`${okReadsConstants.API_LINKS.READING_API}`)
        .error(null);
    });
  });

  describe('undoAddBook$', () => {
    it('should undo addition of book to the reading list when showSnackbar action is dispatched and action type is ADD', (done) => {
      const book: Book = { ...createBook('A'), isAdded: true };
      actions = of(
        ReadingListActions.confirmedAddToReadingList({
          book: book,
          showSnackBar: true,
        })
      );

      effects.undoAddBook$.subscribe((action) => {
        expect(action).toEqual(
          ReadingListActions.showSnackBar({
            actionType: okReadsConstants.SNACKBAR_ACTIONS.ADD,
            item: { bookId: book.id, ...book },
          })
        );
        done();
      });
    });
  });

  describe('removeBook$', () => {
    it('should remove book from the reading list successfully when remove button is clicked and no snackbar action is performed', (done) => {
      const item = createReadingListItem('A');
      actions = of(
        ReadingListActions.removeFromReadingList({
          item: item,
          showSnackBar: true,
        })
      );

      effects.removeBook$.subscribe((action) => {
        expect(action).toEqual(
          ReadingListActions.confirmedRemoveFromReadingList({
            item: item,
            showSnackBar: true,
          })
        );
        done();
      });

      httpMock
        .expectOne(`${okReadsConstants.API_LINKS.READING_API}/${item.bookId}`)
        .flush([item]);
    });
    it('should dispatch failedRemoveFromReadingList when api throws an error', (done) => {
      const item: ReadingListItem = createReadingListItem('A');
      actions = of(
        ReadingListActions.removeFromReadingList({ item, showSnackBar: true })
      );

      effects.removeBook$.subscribe((action) => {
        expect(action).toEqual(
          ReadingListActions.failedRemoveFromReadingList({ item })
        );
        done();
      });

      httpMock
        .expectOne(`${okReadsConstants.API_LINKS.READING_API}/${item.bookId}`)
        .error(null);
    });
  });

  describe('undoRemoveBook$', () => {
    it('should undo removal of book from the reading list when showSnackbar action is dispatched and action type is REMOVED', (done) => {
      const item: ReadingListItem = createReadingListItem('A');
      actions = of(
        ReadingListActions.confirmedRemoveFromReadingList({
          item: item,
          showSnackBar: true,
        })
      );

      effects.undoRemoveBook$.subscribe((action) => {
        expect(action).toEqual(
          ReadingListActions.showSnackBar({
            actionType: okReadsConstants.SNACKBAR_ACTIONS.REMOVE,
            item: action.item,
          })
        );
        done();
      });
    });
  });
});
