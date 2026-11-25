<template>
  <footer class="site-footer">
    <div class="footer-content">
      <NuxtLink to="/" class="footer-logo-box">
        <img src="/logo_transparent.png" alt="شو صار" class="footer-logo-img" />
        <div>
          <strong style="color: #FFFFFF; font-size: 1.05rem; display: block;">منصة شو صار الإخبارية</strong>
          <span style="color: #94A3B8; font-size: 0.8rem;">بيروت • لبنان | ShouSar Media Network</span>
        </div>
      </NuxtLink>

      <div class="footer-text">
        جميع الحقوق محفوظة © {{ new Date().getFullYear() }} شو صار — منصة إخبارية ومجتمعية مفتوحة.
      </div>
    </div>
  </footer>
</template>
