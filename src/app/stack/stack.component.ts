import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stack.component.html',
  styleUrls: ['./stack.component.scss']
})
export class StackComponent implements OnInit, OnDestroy {

  get isLight(): boolean {
    return document.documentElement.hasAttribute('data-theme');
  }

  techs = [
    { name: 'Angular',    icon: 'assets/icons/angular.svg'              },
    { name: '.NET',       icon: 'assets/icons/dotnet.svg'               },
    { name: 'TypeScript', icon: 'assets/icons/src_svgs_typescript.svg'  },
    { name: 'JavaScript', icon: 'assets/icons/src_svgs_javascript.svg'  },
    { name: 'RAG',        icon: 'assets/icons/database-svgrepo-com.svg' },
    { name: 'Python',     icon: 'assets/icons/python.svg'               },
    { name: 'C#',         icon: 'assets/icons/csharp-original.svg'      },
    { name: 'HTML',       icon: 'assets/icons/html5-original.svg'       },
    { name: 'CSS',        icon: 'assets/icons/css3-original.svg'        },
  ];

  socials = {
    instagram: 'https://www.instagram.com/mo_fullstack?igsh=MWQyaWFiaXd6aTh0aw%3D%3D&utm_source=qr',
    linkedin:  'https://www.linkedin.com/in/mohamed-eltramsy-0604ab320',
    github:    'https://github.com/mohamedeltramsy71-dev',
  };

  overlayVisible = false;
  overlayWord    = '';
  overlayPhase: 'in' | 'hold' | 'out' = 'in';
  private scrollLocked = false;
  private t1: any; private t2: any; private t3: any;
  private wheelHandler = (e: WheelEvent) => this.onWheel(e);

  constructor(private router: Router) {}

  ngOnInit() {
    this.scrollLocked = true;
    setTimeout(() => { this.scrollLocked = false; }, 700);

    window.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  ngOnDestroy() {
    clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3);
    window.removeEventListener('wheel', this.wheelHandler);
  }

  onWheel(e: WheelEvent) {
    const atTop    = window.scrollY === 0;
    const atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 2;

    // لو لسه في محتوى، اسكرول عادي من غير ما ننقل
    if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
      return;
    }

    // وصلنا للحد — امنع الـ scroll وابدأ الـ transition
    e.preventDefault();

    if (this.scrollLocked) return;

    if (e.deltaY < -30) {
      this.triggerTransition('Home', '/');
    } else if (e.deltaY > 30) {
      this.triggerTransition('Projects', '/projects');
    }
  }

  private triggerTransition(word: string, route: string) {
    this.scrollLocked   = true;
    this.overlayWord    = word;
    this.overlayPhase   = 'in';
    this.overlayVisible = true;

    this.t1 = setTimeout(() => { this.overlayPhase = 'hold'; }, 250);
    this.t2 = setTimeout(() => { this.overlayPhase = 'out'; }, 900);
    this.t3 = setTimeout(() => {
      this.overlayVisible = false;
      this.router.navigate([route]);
    }, 1300);
  }
}