import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  addToReadingList,
  clearSearch,
  getAllBooks,
  searchBooks,
} from '@tmo/books/data-access';
import { FormBuilder } from '@angular/forms';
import { Book, okReadsConstants } from '@tmo/shared/models';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
@Component({
  selector: 'tmo-book-search',
  templateUrl: './book-search.component.html',
  styleUrls: ['./book-search.component.scss'],
})
export class BookSearchComponent {
  bookSearchConstants = okReadsConstants;
  books$ = this.store.select(getAllBooks);

  private subscription$: Subscription;

  searchForm = this.fb.group({
    term: '',
  });

  constructor(
    private readonly store: Store,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.subscription$ = this.searchForm.controls['term'].valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.searchBooks();
      });
  }

  addBookToReadingList = (book: Book) => {
    this.store.dispatch(addToReadingList({ book }));
  };

  searchExample = () => {
    this.searchForm.controls.term.setValue('javascript');
  };

  searchBooks = () => {
    if (this.searchForm.value.term)
      this.store.dispatch(searchBooks({ term: this.searchForm.value.term }));
  };

  resetSearch = () => {
    this.searchForm.controls.term.setValue(null);
    this.store.dispatch(clearSearch());
  };

  ngOnDestroy = () => {
    this.subscription$.unsubscribe();
  };
}
