import { ResolvedPos } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import {
  Plugin,
  EditorState,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state';
import { schema } from './schema';

const SHOW_CLS = 'show';

const HTTP_LINK = new RegExp('^https?://');

const MAILTO_LINK = new RegExp('^mailto:');

export class TooltipPlugin extends Plugin {
  private rootEl: HTMLDivElement;
  private tooltipEl: HTMLDivElement;
  private view: EditorView;
  private txt: string;

  static nodeToAnchorHref(url: string) {
    if (HTTP_LINK.test(url) || MAILTO_LINK.test(url)) {
      return url;
    }
    return `http://${url}`;
  }

  constructor(el: HTMLDivElement) {
    super({
      view: (viewInstance) => {
        this.view = viewInstance;
        return {
          destroy: () => {
            this.hide();
          },
          update: (view, previousState) => {
            this.checkSelection();
          },
        };
      },
    });

    this.tooltipEl = el;
  }

  private checkSelection = () => {
    const selection: TextSelection = this.view.state.selection;
    const { $cursor } = selection;

    const withinLink = Boolean(
      $cursor &&
        $cursor.nodeBefore &&
        $cursor.nodeAfter &&
        $cursor.nodeBefore.marks.some(
          (mark) => mark.type === schema.marks.link,
        ) &&
        $cursor.nodeAfter.marks.some((mark) => mark.type === schema.marks.link),
    );

    if (withinLink === false) {
      this.hide();
      return;
    }

    const mark = $cursor.nodeBefore.marks.find(
      (mark) => mark.type === schema.marks.link,
    );

    this.show($cursor, mark.attrs.href);
  };

  private hide = () => {
    this.tooltipEl.classList.remove(SHOW_CLS);
  };

  private show = ($pos: ResolvedPos, url: string) => {
    const { left, top } = this.view.coordsAtPos($pos.pos);
    this.linkTextEl.innerText = url;
    this.anchorEl.href = TooltipPlugin.nodeToAnchorHref(url);
    this.tooltipEl.style.left = `${left}px`;
    const scrolled = (this.view.root as Document).documentElement;
    // Pull top up by presumed height of tooltip plus some margin
    this.tooltipEl.style.top = `${top - 36 + scrolled.scrollTop}px`;
    this.tooltipEl.classList.add(SHOW_CLS);
  };

  get linkTextEl(): HTMLSpanElement {
    return this.tooltipEl.querySelector('div.text');
  }

  get anchorEl(): HTMLAnchorElement {
    return this.tooltipEl.querySelector('a.link-anchor');
  }
}
