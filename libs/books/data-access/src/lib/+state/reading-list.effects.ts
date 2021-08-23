import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, exhaustMap, filter, map, switchMap } from 'rxjs/operators';
import { ReadingListItem } from '@tmo/shared/models';
import * as ReadingListActions from './reading-list.actions';
import { okReadsConstants } from '@tmo/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

const {
  ACTION,
  BOOK_ADDED,
  ADD,
  REMOVE,
  BOOK_ADDED_CLASS,
  BOOK_REMOVED,
  BOOK_REMOVED_CLASS,
  DURATION,
} = okReadsConstants.SNACKBAR_ACTIONS;
@Injectable()
export class ReadingListEffects implements OnInitEffects {
  loadReadingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReadingListActions.init),
      exhaustMap(() =>
        this.http.get<ReadingListItem[]>(`${okReadsConstants.API_LINKS.READING_API}`).pipe(
          map((data) =>
            ReadingListActions.loadReadingListSuccess({ list: data })
          ),
          catchError((error) =>
            of(ReadingListActions.loadReadingListError({ error }))
          )
        )
      )
    )
  );

  addBook$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReadingListActions.addToReadingList),
      concatMap(({ book, showSnackBar }) => {
        const addedBook = {
          ...book,
          isAdded: true
        }
        return this.http.post(`${okReadsConstants.API_LINKS.READING_API}`, addedBook).pipe(
          map(() =>
            ReadingListActions.confirmedAddToReadingList({ book: addedBook, showSnackBar })
          ),
          catchError(() =>
            of(ReadingListActions.failedAddToReadingList({ book }))
          )
        )
        })
    )
  );

  removeBook$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReadingListActions.removeFromReadingList),
      concatMap(({ item, showSnackBar }) =>
        this.http.delete(`${okReadsConstants.API_LINKS.READING_API}/${item.bookId}`).pipe(
          map(() =>
            ReadingListActions.confirmedRemoveFromReadingList({
              item,
              showSnackBar,
            })
          ),
          catchError(() =>
            of(ReadingListActions.failedRemoveFromReadingList({ item }))
          )
        )
      )
    )
  );

  undoAddBook$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReadingListActions.confirmedAddToReadingList),
      filter((action) => action.showSnackBar),
      map((action) =>
        ReadingListActions.showSnackBar({
          actionType: ADD,
          item: { bookId: action.book.id, ...action.book },
        })
      )
    )
  );

  undoRemoveBook$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReadingListActions.confirmedRemoveFromReadingList),
      filter((action) => action.showSnackBar),
      map((action) =>
        ReadingListActions.showSnackBar({
          actionType: REMOVE,
          item: action.item,
        })
      )
    )
  );

  openSnackBar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReadingListActions.showSnackBar),
      switchMap((action) => {
        const title = action.item.title + ' - '
        return this.snackBar
          .open(action.actionType === ADD ? title + BOOK_ADDED : title + BOOK_REMOVED, ACTION, {
            duration: DURATION,
            panelClass:
              action.actionType === ADD ? BOOK_ADDED_CLASS : BOOK_REMOVED_CLASS,
          })
          .onAction()
          .pipe(
            map(() =>
              action.actionType === ADD
                ? ReadingListActions.removeFromReadingList({
                    item: action.item,
                    showSnackBar: false,
                  })
                : ReadingListActions.addToReadingList({
                    book: { id : action.item.bookId, ...action.item },
                    showSnackBar: false,
                  })
            )
          )
                })
    )
  );

  ngrxOnInitEffects() {
    return ReadingListActions.init();
  }

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}
}
