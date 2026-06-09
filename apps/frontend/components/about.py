"""Shared About / Built-by sidebar, rendered identically across pages."""

import streamlit as st


def render_about_sidebar() -> None:
    """Render the maker credit + data-source disclosure into the sidebar."""
    st.sidebar.markdown("#### About")
    st.sidebar.markdown(
        "**CreatorPulse India** — built by **Ayush Gupta**.  \n"
        "[GitHub](https://github.com/ayushgupta07xx) · "
        "[LinkedIn](https://www.linkedin.com/in/ayush-gupta-544a803a2)"
    )
    st.sidebar.caption(
        "Data via the official YouTube Data API v3. Engagement and earnings "
        "figures are model estimates, not platform-verified."
    )
